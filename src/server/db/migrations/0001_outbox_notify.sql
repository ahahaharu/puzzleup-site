-- Будит воркер сразу после вставки задания (docs/architecture.md, раздел 5): LISTEN outbox,
-- в payload – только id задания. Опрос раз в 5 с остаётся страховкой.
CREATE FUNCTION outbox_notify() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('outbox', NEW.id::text);
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER outbox_notify AFTER INSERT ON outbox
  FOR EACH ROW EXECUTE FUNCTION outbox_notify();
