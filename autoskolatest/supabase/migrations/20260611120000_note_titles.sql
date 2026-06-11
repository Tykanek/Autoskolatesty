alter table public.user_question_notes
  add column if not exists note_title text not null default 'Moje poznámka';

alter table public.user_question_notes
  drop constraint if exists user_question_notes_title_length;

alter table public.user_question_notes
  add constraint user_question_notes_title_length
  check (char_length(trim(note_title)) between 2 and 100);

alter table public.user_question_notes
  drop constraint if exists user_question_notes_note_length;

alter table public.user_question_notes
  add constraint user_question_notes_note_length
  check (char_length(trim(note)) between 3 and 10000)
  not valid;
