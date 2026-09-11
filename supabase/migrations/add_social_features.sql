-- PokeGuide: amistades y chat privado. Ejecuta una vez en Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_no_self_request CHECK (requester_id <> recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_unique_pair
  ON public.friend_requests (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  CONSTRAINT messages_no_self_message CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (sender_id, receiver_id, created_at);

DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own friend relations" ON public.friend_requests FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, recipient_id));
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND requester_id <> recipient_id AND status = 'pending');
CREATE POLICY "Recipients can answer friend requests" ON public.friend_requests FOR UPDATE TO authenticated USING (auth.uid() = recipient_id AND status = 'pending') WITH CHECK (auth.uid() = recipient_id AND status IN ('accepted', 'rejected'));
CREATE POLICY "Friends can remove their own relation" ON public.friend_requests FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, recipient_id));
CREATE POLICY "Users can read their own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Friends can send private messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.friend_requests f WHERE f.status = 'accepted' AND ((f.requester_id = sender_id AND f.recipient_id = receiver_id) OR (f.requester_id = receiver_id AND f.recipient_id = sender_id))));
CREATE POLICY "Recipients can mark received messages as read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friend_requests') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; END IF;
END $$;
