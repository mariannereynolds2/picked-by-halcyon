-- Editorial fields used by the admin book and author editors.
ALTER TABLE pbh_books ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE pbh_authors ADD COLUMN bio TEXT NOT NULL DEFAULT '';
