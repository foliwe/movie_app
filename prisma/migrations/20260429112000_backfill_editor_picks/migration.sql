DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Movie" WHERE "editorPick" = true) THEN
    UPDATE "Movie"
    SET "editorPick" = true
    WHERE "id" IN (
      SELECT "id"
      FROM "Movie"
      WHERE "workflowStatus" = 'Published'
      ORDER BY "sortOrder" ASC
      LIMIT 3
    );
  END IF;
END $$;
