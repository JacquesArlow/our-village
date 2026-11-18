UPDATE `event`
SET `public_details` = replace(`public_details`, 'Alsation', 'Alsatian'),
    `detail` = replace(`detail`, 'Alsation', 'Alsatian'),
    `updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE `public_details` LIKE '%Alsation%' OR `detail` LIKE '%Alsation%';
