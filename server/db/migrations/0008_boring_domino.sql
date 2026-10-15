ALTER TABLE `event` ADD `public_details` text;
--> statement-breakpoint
UPDATE `event`
SET `public_details` = '{"startTime":"08:30","endTime":"12:00","venue":"Our Village Training Space","address":"525 Alsation Drive, Garsfontein, Pretoria","presenter":"Sr Rene van der Bank","posterUrl":"/events/little-lifelines-cpr-2026-10-31.webp"}',
    `detail` = 'Gain the confidence and practical skills to help a child in an emergency.',
    `updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE `id` = 'af71ab8e-0dd8-4517-b50b-0ad33c0dfe7f' AND `start_date` = '2026-10-31' AND `public_details` IS NULL;
