-- DropIndex
DROP INDEX "JoinRequest_organizationId_userId_status_key";

-- CreateIndex
CREATE UNIQUE INDEX "JoinRequest_organizationId_userId_key" ON "JoinRequest"("organizationId", "userId");

