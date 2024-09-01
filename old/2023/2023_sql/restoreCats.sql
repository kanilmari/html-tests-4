UPDATE categories
SET parent_id = categories2.parent_id, name = categories2.name
FROM categories2
WHERE categories.id = categories2.id;
