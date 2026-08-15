import { mkdir, readFile, writeFile } from 'node:fs/promises';

const iconRoot = new URL('../src/assets/aws-architecture-icons/2026-07-31/', import.meta.url);
const outputRoot = new URL('../public/diagrams/', import.meta.url);

await mkdir(outputRoot, { recursive: true });

async function iconData(name) {
  const svg = await readFile(new URL(`${name}.svg`, iconRoot));
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}

const icons = Object.fromEntries(await Promise.all(
  ['iam', 's3', 'kinesis-data-streams', 'emr', 'dynamodb', 'glue']
    .map(async (name) => [name, await iconData(name)])
));

function serviceIcon(name, x, y, label, detail = '') {
  const detailLine = detail
    ? `<text x="${x + 40}" y="${y + 116}" class="detail" text-anchor="middle">${detail}</text>`
    : '';

  return `
    <image href="${icons[name]}" x="${x}" y="${y}" width="80" height="80" />
    <text x="${x + 40}" y="${y + 99}" class="label" text-anchor="middle">${label}</text>
    ${detailLine}`;
}

function shell(title, description, body, height = 700) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="diagram-title diagram-description">
  <title id="diagram-title">${title}</title>
  <desc id="diagram-description">${description}</desc>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
    </marker>
    <style>
      .title { fill: #111827; font: 700 28px Arial, sans-serif; }
      .group-title { fill: #374151; font: 700 20px Arial, sans-serif; }
      .label { fill: #111827; font: 700 17px Arial, sans-serif; }
      .detail { fill: #4b5563; font: 15px Arial, sans-serif; }
      .edge-label { fill: #1f2937; font: 700 15px Arial, sans-serif; paint-order: stroke; stroke: #ffffff; stroke-width: 5px; stroke-linejoin: round; }
      .group { fill: #f9fafb; stroke: #94a3b8; stroke-width: 2; }
      .policy { fill: #fff7ed; stroke: #f59e0b; stroke-width: 2; }
      .client { fill: #eff6ff; stroke: #3b82f6; stroke-width: 2; }
      .flow { fill: none; stroke: #3b82f6; stroke-width: 3; marker-end: url(#arrow); }
      .relation { fill: none; stroke: #64748b; stroke-width: 2; stroke-dasharray: 8 7; marker-end: url(#arrow); }
    </style>
  </defs>
  <rect width="1200" height="${height}" fill="#ffffff" />
  <text x="36" y="48" class="title">${title}</text>
  ${body}
</svg>
`;
}

const beginner = shell(
  'S3 control-plane and data-plane requests',
  'A client sends separate control-plane and data-plane requests to Amazon S3. AWS evaluates authorization policies for both requests. Stored bucket configuration constrains later object requests.',
  `
  <rect x="34" y="276" width="180" height="126" rx="12" class="client" />
  <text x="124" y="326" class="label" text-anchor="middle">Console, CLI,</text>
  <text x="124" y="350" class="label" text-anchor="middle">or SDK</text>
  <text x="124" y="378" class="detail" text-anchor="middle">AWS API client</text>

  <rect x="292" y="76" width="186" height="170" rx="12" class="policy" />
  ${serviceIcon('iam', 345, 92, 'Authorization', 'IAM and resource policies')}

  <rect x="530" y="82" width="636" height="226" rx="14" class="group" />
  <text x="556" y="116" class="group-title">S3 control plane</text>
  ${serviceIcon('s3', 582, 148, 'Bucket configuration')}
  <text x="738" y="172" class="label">CreateBucket</text>
  <text x="738" y="204" class="detail">Creates the bucket and selects its Region</text>
  <text x="738" y="236" class="label">PutBucketPolicy and encryption settings</text>
  <text x="738" y="268" class="detail">Change configuration for later requests</text>

  <rect x="530" y="386" width="636" height="226" rx="14" class="group" />
  <text x="556" y="420" class="group-title">S3 data plane</text>
  ${serviceIcon('s3', 582, 454, 'Object traffic')}
  <text x="738" y="478" class="label">PutObject</text>
  <text x="738" y="510" class="detail">Stores object bytes and metadata</text>
  <text x="738" y="542" class="label">GetObject and DeleteObject</text>
  <text x="738" y="574" class="detail">Read or remove an existing object</text>

  <path d="M214 322 C330 300, 390 192, 530 192" class="flow" />
  <text x="222" y="258" class="edge-label">control-plane API</text>
  <path d="M214 370 C334 394, 394 500, 530 500" class="flow" />
  <text x="286" y="438" class="edge-label">data-plane API</text>

  <path d="M478 160 C500 160, 500 174, 530 174" class="relation" />
  <path d="M385 246 C385 354, 455 454, 530 454" class="relation" />
  <text x="396" y="342" class="edge-label">authorization input</text>

  <path d="M850 308 L850 386" class="relation" />
  <text x="870" y="352" class="edge-label">configuration constrains requests</text>
  `
);

const relay = shell(
  'Cross-account Kinesis bridge with Amazon EMR',
  'Amazon EMR reads a Kinesis data stream in Account A. DynamoDB and Amazon S3 store connector and Spark state. The job writes by stream ARN to a Kinesis data stream in Account B, where AWS Glue consumes the records.',
  `
  <rect x="28" y="82" width="726" height="574" rx="14" class="group" />
  <text x="54" y="118" class="group-title">AWS Account A: producer</text>
  <rect x="782" y="82" width="390" height="574" rx="14" class="group" />
  <text x="808" y="118" class="group-title">AWS Account B: analytics</text>

  ${serviceIcon('kinesis-data-streams', 82, 180, 'Kinesis source', '480 source shards')}
  ${serviceIcon('emr', 344, 180, 'Amazon EMR', 'Spark streaming job')}
  ${serviceIcon('kinesis-data-streams', 814, 180, 'Kinesis destination', 'analytics ingress')}
  ${serviceIcon('glue', 1034, 180, 'AWS Glue', 'streaming consumer')}

  ${serviceIcon('dynamodb', 224, 446, 'DynamoDB', 'connector shard state')}
  ${serviceIcon('s3', 464, 446, 'Amazon S3', 'Spark checkpoint')}

  <rect x="814" y="442" width="310" height="126" rx="12" class="policy" />
  <text x="969" y="480" class="label" text-anchor="middle">Destination access contract</text>
  <text x="969" y="512" class="detail" text-anchor="middle">Kinesis resource policy</text>
  <text x="969" y="540" class="detail" text-anchor="middle">KMS key policy when required</text>

  <path d="M162 220 L344 220" class="flow" />
  <text x="205" y="204" class="edge-label">enhanced fan-out</text>
  <path d="M424 220 L814 220" class="flow" />
  <text x="520" y="204" class="edge-label">PutRecords by destination stream ARN</text>
  <path d="M894 220 L1034 220" class="flow" />
  <text x="926" y="204" class="edge-label">consume</text>

  <path d="M264 446 C264 368, 344 340, 374 300" class="relation" />
  <path d="M504 446 C504 368, 448 340, 414 300" class="relation" />
  <path d="M969 442 L914 300" class="relation" />
  `
);

await Promise.all([
  writeFile(new URL('s3-control-data-planes.svg', outputRoot), beginner.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('cross-account-kinesis-emr.svg', outputRoot), relay.replace(/[ \t]+$/gm, ''))
]);

console.log('Generated 2 self-contained AWS architecture diagrams.');
