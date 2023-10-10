# Messages Publisher

A tool for publishing Apple Messages as a PDF


# References

- [FontForge](https://fontforge.org) was used to create the combined NotoSans-NotoEmoji font, as described in the following post: https://superuser.com/a/491086

```
SELECT a.*
FROM attachment a
LEFT JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
WHERE maj.message_id IN (
SELECT maj.message_id
FROM attachment a
LEFT JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
WHERE mime_type == 'image/heic') ORDER BY original_guid
```
