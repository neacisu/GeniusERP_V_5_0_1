#!/bin/bash
#
# Script pentru fix-uire TOATE referințele la nume vechi în fișierele schema
# Înlocuiește în FK-uri, relații, Zod schemas, type exports
#

cd /var/www/GeniusERP/libs/shared/src/schema

echo "=== FIX REFERENCES IN CRM SCHEMA ==="

# CRM Schema - Fix all old references
sed -i 's/customers\.id/crm_customers.id/g' crm.schema.ts
sed -i 's/contacts\.id/crm_contacts.id/g' crm.schema.ts
sed -i 's/pipelines\.id/crm_pipelines.id/g' crm.schema.ts
sed -i 's/pipelineStages\.id/crm_stages.id/g' crm.schema.ts
sed -i 's/deals\.id/crm_deals.id/g' crm.schema.ts
sed -i 's/dealStageHistory\.id/crm_stage_history.id/g' crm.schema.ts
sed -i 's/activities\.id/crm_activities.id/g' crm.schema.ts
sed -i 's/tags\.id/crm_tags.id/g' crm.schema.ts
sed -i 's/customerTags\.id/crm_customer_tags.id/g' crm.schema.ts
sed -i 's/dealTags\.id/crm_deal_tags.id/g' crm.schema.ts
sed -i 's/segments\.id/crm_segments.id/g' crm.schema.ts
sed -i 's/emailTemplates\.id/crm_email_templates.id/g' crm.schema.ts

# Fix relation names
sed -i 's/one(customers,/one(crm_customers,/g' crm.schema.ts
sed -i 's/many(customers/many(crm_customers/g' crm.schema.ts
sed -i 's/one(contacts,/one(crm_contacts,/g' crm.schema.ts
sed -i 's/many(contacts/many(crm_contacts/g' crm.schema.ts
sed -i 's/one(pipelines,/one(crm_pipelines,/g' crm.schema.ts
sed -i 's/many(pipelines/many(crm_pipelines/g' crm.schema.ts
sed -i 's/one(pipelineStages,/one(crm_stages,/g' crm.schema.ts
sed -i 's/many(pipelineStages/many(crm_stages/g' crm.schema.ts
sed -i 's/one(deals,/one(crm_deals,/g' crm.schema.ts
sed -i 's/many(deals/many(crm_deals/g' crm.schema.ts
sed -i 's/one(activities,/one(crm_activities,/g' crm.schema.ts
sed -i 's/many(activities/many(crm_activities/g' crm.schema.ts
sed -i 's/one(tags,/one(crm_tags,/g' crm.schema.ts
sed -i 's/many(tags/many(crm_tags/g' crm.schema.ts

# Fix Zod schemas
sed -i 's/createInsertSchema(customers/createInsertSchema(crm_customers/g' crm.schema.ts
sed -i 's/createInsertSchema(contacts/createInsertSchema(crm_contacts/g' crm.schema.ts
sed -i 's/createInsertSchema(pipelines/createInsertSchema(crm_pipelines/g' crm.schema.ts
sed -i 's/createInsertSchema(pipelineStages/createInsertSchema(crm_stages/g' crm.schema.ts
sed -i 's/createInsertSchema(deals/createInsertSchema(crm_deals/g' crm.schema.ts
sed -i 's/createInsertSchema(dealStageHistory/createInsertSchema(crm_stage_history/g' crm.schema.ts
sed -i 's/createInsertSchema(activities/createInsertSchema(crm_activities/g' crm.schema.ts
sed -i 's/createInsertSchema(tags/createInsertSchema(crm_tags/g' crm.schema.ts
sed -i 's/createInsertSchema(customerTags/createInsertSchema(crm_customer_tags/g' crm.schema.ts
sed -i 's/createInsertSchema(dealTags/createInsertSchema(crm_deal_tags/g' crm.schema.ts
sed -i 's/createInsertSchema(segments/createInsertSchema(crm_segments/g' crm.schema.ts
sed -i 's/createInsertSchema(emailTemplates/createInsertSchema(crm_email_templates/g' crm.schema.ts

# Fix type exports
sed -i 's/typeof customers\.\$inferSelect/typeof crm_customers.$inferSelect/g' crm.schema.ts
sed -i 's/typeof contacts\.\$inferSelect/typeof crm_contacts.$inferSelect/g' crm.schema.ts
sed -i 's/typeof pipelines\.\$inferSelect/typeof crm_pipelines.$inferSelect/g' crm.schema.ts
sed -i 's/typeof pipelineStages\.\$inferSelect/typeof crm_stages.$inferSelect/g' crm.schema.ts
sed -i 's/typeof deals\.\$inferSelect/typeof crm_deals.$inferSelect/g' crm.schema.ts
sed -i 's/typeof activities\.\$inferSelect/typeof crm_activities.$inferSelect/g' crm.schema.ts
sed -i 's/typeof tags\.\$inferSelect/typeof crm_tags.$inferSelect/g' crm.schema.ts

echo "✅ CRM schema fixed"

echo ""
echo "=== DONE ==="

