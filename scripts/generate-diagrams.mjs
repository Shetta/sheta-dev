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

function formalShell(title, description, body, height = 640) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="diagram-title diagram-description">
  <title id="diagram-title">${title}</title>
  <desc id="diagram-description">${description}</desc>
  <defs>
    <marker id="formal-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#475569" />
    </marker>
    <filter id="formal-shadow" x="-15%" y="-15%" width="130%" height="145%">
      <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#0f172a" flood-opacity=".12" />
    </filter>
    <style>
      .formal-title { fill: #0f172a; font: 700 30px Arial, sans-serif; }
      .formal-subtitle { fill: #475569; font: 17px Arial, sans-serif; }
      .formal-card { stroke: #cbd5e1; stroke-width: 1.5; }
      .formal-card-title { fill: #0f172a; font: 700 20px Arial, sans-serif; }
      .formal-card-copy { fill: #334155; font: 16px Arial, sans-serif; }
      .formal-small { fill: #475569; font: 14px Arial, sans-serif; }
      .formal-chip { fill: #ffffff; font: 700 15px Arial, sans-serif; }
      .formal-arrow { fill: none; stroke: #475569; stroke-width: 3; marker-end: url(#formal-arrow); }
      .formal-dashed { fill: none; stroke: #64748b; stroke-width: 2; stroke-dasharray: 8 7; }
      .formal-lane { fill: none; stroke: #cbd5e1; stroke-width: 2; }
    </style>
  </defs>
  <rect width="1200" height="${height}" fill="#f8fafc" />
  <circle cx="1110" cy="52" r="110" fill="#ede9fe" opacity=".7" />
  <circle cx="75" cy="${height - 20}" r="125" fill="#cffafe" opacity=".6" />
  <text x="48" y="52" class="formal-title">${title}</text>
  <text x="48" y="82" class="formal-subtitle">${description}</text>
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

const verificationLoop = formalShell(
  'From requirement to formal evidence',
  'A checker evaluates a precise claim. Human review connects the result to the production need.',
  `
  <g filter="url(#formal-shadow)">
    <rect x="48" y="145" width="246" height="190" rx="18" fill="#ede9fe" class="formal-card" />
    <rect x="48" y="145" width="246" height="12" rx="6" fill="#7c3aed" />
    <circle cx="84" cy="193" r="20" fill="#7c3aed" />
    <text x="84" y="199" class="formal-chip" text-anchor="middle">1</text>
    <text x="116" y="199" class="formal-card-title">Requirement</text>
    <text x="72" y="245" class="formal-card-copy">One logical operation</text>
    <text x="72" y="271" class="formal-card-copy">must cause at most</text>
    <text x="72" y="297" class="formal-card-copy">one payment.</text>

    <rect x="334" y="145" width="246" height="190" rx="18" fill="#e0f2fe" class="formal-card" />
    <rect x="334" y="145" width="246" height="12" rx="6" fill="#0284c7" />
    <circle cx="370" cy="193" r="20" fill="#0284c7" />
    <text x="370" y="199" class="formal-chip" text-anchor="middle">2</text>
    <text x="402" y="199" class="formal-card-title">Model + property</text>
    <text x="358" y="245" class="formal-card-copy">Encode the permitted</text>
    <text x="358" y="271" class="formal-card-copy">steps and require</text>
    <text x="358" y="297" class="formal-card-copy">effects ≤ 1.</text>

    <rect x="620" y="145" width="246" height="190" rx="18" fill="#d1fae5" class="formal-card" />
    <rect x="620" y="145" width="246" height="12" rx="6" fill="#059669" />
    <circle cx="656" cy="193" r="20" fill="#059669" />
    <text x="656" y="199" class="formal-chip" text-anchor="middle">3</text>
    <text x="688" y="199" class="formal-card-title">Checker</text>
    <text x="644" y="245" class="formal-card-copy">Explore states or</text>
    <text x="644" y="271" class="formal-card-copy">validate a proof</text>
    <text x="644" y="297" class="formal-card-copy">against the claim.</text>

    <rect x="906" y="145" width="246" height="190" rx="18" fill="#fef3c7" class="formal-card" />
    <rect x="906" y="145" width="246" height="12" rx="6" fill="#d97706" />
    <circle cx="942" cy="193" r="20" fill="#d97706" />
    <text x="942" y="199" class="formal-chip" text-anchor="middle">4</text>
    <text x="974" y="199" class="formal-card-title">Evidence</text>
    <text x="930" y="245" class="formal-card-copy">A counterexample or</text>
    <text x="930" y="271" class="formal-card-copy">no violation in the</text>
    <text x="930" y="297" class="formal-card-copy">checked scope.</text>
  </g>

  <path d="M294 240 L334 240" class="formal-arrow" />
  <path d="M580 240 L620 240" class="formal-arrow" />
  <path d="M866 240 L906 240" class="formal-arrow" />

  <g filter="url(#formal-shadow)">
    <rect x="196" y="412" width="808" height="112" rx="18" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" />
    <circle cx="246" cy="468" r="24" fill="#dc2626" />
    <text x="246" y="475" class="formal-chip" text-anchor="middle">?</text>
    <text x="288" y="455" class="formal-card-title">Human review remains necessary</text>
    <text x="288" y="486" class="formal-card-copy">Does the checked property express the production requirement?</text>
  </g>
  <path d="M1029 335 C1029 382, 1004 392, 974 412" class="formal-arrow" />
  <path d="M226 412 C176 382, 164 348, 174 335" class="formal-arrow" />
  `,
  590
);

const duplicateTrace = formalShell(
  'The duplicate-effect trace',
  'Both workers observe an incomplete operation before either worker records completion.',
  `
  <rect x="72" y="118" width="224" height="46" rx="23" fill="#7c3aed" />
  <text x="184" y="147" class="formal-chip" text-anchor="middle">Worker A</text>
  <rect x="352" y="118" width="224" height="46" rx="23" fill="#0284c7" />
  <text x="464" y="147" class="formal-chip" text-anchor="middle">Worker B</text>
  <rect x="632" y="118" width="224" height="46" rx="23" fill="#059669" />
  <text x="744" y="147" class="formal-chip" text-anchor="middle">Payment effect</text>
  <rect x="912" y="118" width="224" height="46" rx="23" fill="#d97706" />
  <text x="1024" y="147" class="formal-chip" text-anchor="middle">Completion state</text>

  <path d="M184 180 L184 650" class="formal-lane" />
  <path d="M464 180 L464 650" class="formal-lane" />
  <path d="M744 180 L744 650" class="formal-lane" />
  <path d="M1024 180 L1024 650" class="formal-lane" />

  <circle cx="184" cy="220" r="10" fill="#7c3aed" />
  <rect x="58" y="244" width="252" height="68" rx="14" fill="#ede9fe" class="formal-card" />
  <text x="184" y="272" class="formal-card-title" text-anchor="middle">Read completion</text>
  <text x="184" y="297" class="formal-card-copy" text-anchor="middle">returns FALSE</text>
  <path d="M310 278 C570 278, 760 220, 1012 220" class="formal-dashed" />

  <circle cx="184" cy="356" r="10" fill="#7c3aed" />
  <path d="M194 356 L728 356" class="formal-arrow" />
  <rect x="650" y="378" width="188" height="55" rx="14" fill="#d1fae5" class="formal-card" />
  <text x="744" y="412" class="formal-card-title" text-anchor="middle">effects = 1</text>

  <circle cx="464" cy="470" r="10" fill="#0284c7" />
  <rect x="338" y="494" width="252" height="68" rx="14" fill="#e0f2fe" class="formal-card" />
  <text x="464" y="522" class="formal-card-title" text-anchor="middle">Read completion</text>
  <text x="464" y="547" class="formal-card-copy" text-anchor="middle">still returns FALSE</text>
  <path d="M590 528 C760 528, 840 470, 1012 470" class="formal-dashed" />

  <circle cx="464" cy="606" r="10" fill="#0284c7" />
  <path d="M474 606 L728 606" class="formal-arrow" />
  <rect x="636" y="632" width="216" height="62" rx="14" fill="#fee2e2" stroke="#ef4444" stroke-width="2" />
  <text x="744" y="660" class="formal-card-title" text-anchor="middle">effects = 2</text>
  <text x="744" y="683" fill="#b91c1c" font-family="Arial, sans-serif" font-size="15" font-weight="700" text-anchor="middle">AtMostOnce violated</text>

  <rect x="912" y="632" width="224" height="62" rx="14" fill="#fef3c7" class="formal-card" />
  <text x="1024" y="660" class="formal-card-title" text-anchor="middle">Completion comes later</text>
  <text x="1024" y="683" class="formal-small" text-anchor="middle">The duplicate effect exists.</text>
  `,
  730
);

const verificationBoundary = formalShell(
  'What the result covers',
  'A formal result is strong inside its stated boundary. Reviewers must examine what remains outside.',
  `
  <g filter="url(#formal-shadow)">
    <rect x="48" y="128" width="520" height="408" rx="22" fill="#ecfdf5" stroke="#10b981" stroke-width="2" />
    <rect x="632" y="128" width="520" height="408" rx="22" fill="#fff7ed" stroke="#f97316" stroke-width="2" />
  </g>

  <circle cx="92" cy="176" r="22" fill="#059669" />
  <text x="92" y="183" class="formal-chip" text-anchor="middle">✓</text>
  <text x="128" y="183" class="formal-card-title">Inside the stated result</text>

  <rect x="80" y="220" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="104" y="248" class="formal-card-title">Artifact</text>
  <text x="104" y="271" class="formal-small">The exact model, code, or proof term that was checked</text>
  <rect x="80" y="300" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="104" y="328" class="formal-card-title">Property</text>
  <text x="104" y="351" class="formal-small">The named invariant, contract, or theorem</text>
  <rect x="80" y="380" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="104" y="408" class="formal-card-title">Scope and bounds</text>
  <text x="104" y="431" class="formal-small">The represented operations, failures, values, and sizes</text>
  <rect x="80" y="460" width="456" height="52" rx="14" fill="#d1fae5" />
  <text x="308" y="492" fill="#065f46" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">Counterexample or checked claim</text>

  <circle cx="676" cy="176" r="22" fill="#ea580c" />
  <text x="676" y="183" class="formal-chip" text-anchor="middle">!</text>
  <text x="712" y="183" class="formal-card-title">Outside the stated result</text>

  <rect x="664" y="220" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="688" y="248" class="formal-card-title">Theorem selection</text>
  <text x="688" y="271" class="formal-small">Whether the property expresses the intended requirement</text>
  <rect x="664" y="300" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="688" y="328" class="formal-card-title">Production correspondence</text>
  <text x="688" y="351" class="formal-small">Whether the deployed code implements the checked artifact</text>
  <rect x="664" y="380" width="456" height="64" rx="14" fill="#ffffff" class="formal-card" />
  <text x="688" y="408" class="formal-card-title">Omitted behavior</text>
  <text x="688" y="431" class="formal-small">Failures, timing, and external semantics absent from the model</text>
  <rect x="664" y="460" width="456" height="52" rx="14" fill="#ffedd5" />
  <text x="892" y="492" fill="#9a3412" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">Evidence that still needs review</text>

  <rect x="198" y="574" width="804" height="76" rx="18" fill="#e0e7ff" stroke="#6366f1" stroke-width="1.5" />
  <text x="600" y="605" class="formal-card-title" text-anchor="middle">Human review connects both sides</text>
  <text x="600" y="632" class="formal-card-copy" text-anchor="middle">State the assumptions, explain the abstraction, and inspect the production boundary.</text>
  `,
  690
);

await Promise.all([
  writeFile(new URL('s3-control-data-planes.svg', outputRoot), beginner.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('cross-account-kinesis-emr.svg', outputRoot), relay.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('formal-verification-loop.svg', outputRoot), verificationLoop.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('duplicate-effect-trace.svg', outputRoot), duplicateTrace.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('verification-boundary.svg', outputRoot), verificationBoundary.replace(/[ \t]+$/gm, ''))
]);

console.log('Generated 5 self-contained diagrams.');
