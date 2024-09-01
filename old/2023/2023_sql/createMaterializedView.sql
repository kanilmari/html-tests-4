CREATE MATERIALIZED VIEW user_rights AS
SELECT gm.user_id, gr.right_id
FROM group_members gm
JOIN group_rights gr ON gm.group_id = gr.group_id;

--REFRESH MATERIALIZED VIEW user_rights;