CREATE INDEX idx_user_rights_user_id ON user_rights(user_id);

CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);

CREATE INDEX idx_group_rights_right_id ON group_rights(right_id);
CREATE INDEX idx_group_rights_group_id ON group_rights(group_id);