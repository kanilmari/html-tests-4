SELECT 
    gr.id, 
    g.name AS group_name,
    r.name AS right_name
FROM 
    public.group_rights AS gr
JOIN 
    public.groups AS g ON gr.group_id = g.id
JOIN 
    public.rights AS r ON gr.right_id = r.id
ORDER BY 
    gr.id ASC;
