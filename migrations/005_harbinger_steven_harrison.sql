-- Add Harbinger: The Prophet's Game to the Picked by Halcyon editorial catalogue.
-- Re-runnable seed: the fixed IDs prevent duplicate book/author rows.
INSERT INTO pbh_books
  (id,title,author,genres,image,amazon,feature,photo,tag,hook,featured_date,status,sort_index)
VALUES
  ('harbinger-steven-harrison','Harbinger: The Prophet''s Game','Steven Harrison',
   '["Mystery & Thriller"]',
   'https://stevenharrisonauthor.com/wp-content/themes/steven-harrison-author-v178/assets/harbinger-book-cover-print.webp',
   'https://www.amazon.co.uk/dp/B0HFN1RQ7G',
   '/books/harbinger-the-prophets-game.html',
   'https://stevenharrisonauthor.com/wp-content/uploads/2026/06/steven-harrison-author-profile-2026-768x1024.jpg',
   'Crime Thriller',
   'A killer leaves a black feather beside each victim, drawing Detective Sam Rourke into a network of corruption that protects Chicago’s elite.',
   '2026-11-25','archive',0)
ON CONFLICT(id) DO UPDATE SET
 title=excluded.title,author=excluded.author,genres=excluded.genres,image=excluded.image,
 amazon=excluded.amazon,feature=excluded.feature,photo=excluded.photo,tag=excluded.tag,
 hook=excluded.hook,status=excluded.status;
INSERT INTO pbh_authors (id,name,books,photo,feature,genres,status)
VALUES
 ('author-steven-harrison','Steven Harrison','["Harbinger: The Prophet''s Game"]',
  'https://stevenharrisonauthor.com/wp-content/uploads/2026/06/steven-harrison-author-profile-2026-768x1024.jpg',
  '', '["Mystery & Thriller"]','published')
ON CONFLICT(id) DO UPDATE SET
 books=excluded.books,photo=excluded.photo,genres=excluded.genres,status='published';
