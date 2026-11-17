-- Better Auth requires a matching local user to be verified before it will
-- implicitly link a verified Google identity. These rows were created by the
-- interrupted pre-1.7 OAuth callback, while the provider-independent member
-- identities already prove that ChatGPT authenticated the same email.
UPDATE "user"
SET
  "emailVerified" = 1,
  "updatedAt" = unixepoch()
WHERE "emailVerified" = 0
  AND EXISTS (
    SELECT 1
    FROM "member_identities"
    WHERE "member_identities"."provider" = 'chatgpt'
      AND lower("member_identities"."email") = lower("user"."email")
  );
