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
      <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
    </marker>
    <pattern id="formal-grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#1e293b" stroke-width="1" />
    </pattern>
    <style>
      .formal-title { fill: #f8fafc; font: 700 29px "DejaVu Sans Mono", monospace; }
      .formal-subtitle { fill: #94a3b8; font: 16px "DejaVu Sans Mono", monospace; }
      .formal-panel { fill: #111827; stroke: #334155; stroke-width: 2; }
      .formal-card-title { fill: #f8fafc; font: 700 19px "DejaVu Sans Mono", monospace; }
      .formal-card-copy { fill: #cbd5e1; font: 15px "DejaVu Sans Mono", monospace; }
      .formal-small { fill: #94a3b8; font: 13px "DejaVu Sans Mono", monospace; }
      .formal-chip { fill: #f8fafc; font: 700 15px "DejaVu Sans Mono", monospace; }
      .formal-label { fill: #93c5fd; font: 700 13px "DejaVu Sans Mono", monospace; letter-spacing: 1.5px; }
      .formal-step { fill: #64748b; font: 13px "DejaVu Sans Mono", monospace; }
      .formal-arrow { fill: none; stroke: #64748b; stroke-width: 2.5; marker-end: url(#formal-arrow); }
      .formal-dashed { fill: none; stroke: #475569; stroke-width: 2; stroke-dasharray: 8 7; marker-end: url(#formal-arrow); }
      .formal-lane { fill: none; stroke: #334155; stroke-width: 2; stroke-dasharray: 7 7; }
    </style>
  </defs>
  <rect width="1200" height="${height}" fill="#0b1020" />
  <rect width="1200" height="${height}" fill="url(#formal-grid)" opacity=".55" />
  <rect width="1200" height="6" fill="#60a5fa" />
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
  <rect x="48" y="142" width="240" height="166" rx="10" class="formal-panel" />
  <rect x="48" y="142" width="240" height="6" fill="#a78bfa" />
  <rect x="70" y="172" width="34" height="34" rx="5" fill="#7c3aed" />
  <text x="87" y="195" class="formal-chip" text-anchor="middle">01</text>
  <text x="120" y="195" class="formal-card-title">Requirement</text>
  <text x="70" y="242" class="formal-card-copy">One logical operation</text>
  <text x="70" y="268" class="formal-card-copy">causes at most</text>
  <text x="70" y="294" class="formal-card-copy">one payment.</text>

  <rect x="336" y="142" width="240" height="166" rx="10" class="formal-panel" />
  <rect x="336" y="142" width="240" height="6" fill="#38bdf8" />
  <rect x="358" y="172" width="34" height="34" rx="5" fill="#0284c7" />
  <text x="375" y="195" class="formal-chip" text-anchor="middle">02</text>
  <text x="408" y="195" class="formal-card-title">Model + property</text>
  <text x="358" y="242" class="formal-card-copy">Encode permitted steps.</text>
  <text x="358" y="268" class="formal-card-copy">Assert</text>
  <text x="422" y="268" fill="#7dd3fc" font-family="DejaVu Sans Mono, monospace" font-size="15" font-weight="700">effects ≤ 1</text>

  <rect x="624" y="142" width="240" height="166" rx="10" class="formal-panel" />
  <rect x="624" y="142" width="240" height="6" fill="#34d399" />
  <rect x="646" y="172" width="34" height="34" rx="5" fill="#059669" />
  <text x="663" y="195" class="formal-chip" text-anchor="middle">03</text>
  <text x="696" y="195" class="formal-card-title">Checker</text>
  <text x="646" y="242" class="formal-card-copy">Explore reachable states</text>
  <text x="646" y="268" class="formal-card-copy">or validate a proof.</text>

  <rect x="912" y="142" width="240" height="166" rx="10" class="formal-panel" />
  <rect x="912" y="142" width="240" height="6" fill="#fbbf24" />
  <rect x="934" y="172" width="34" height="34" rx="5" fill="#d97706" />
  <text x="951" y="195" class="formal-chip" text-anchor="middle">04</text>
  <text x="984" y="195" class="formal-card-title">Evidence</text>
  <text x="934" y="242" class="formal-card-copy">Counterexample, or no</text>
  <text x="934" y="268" class="formal-card-copy">violation in scope.</text>

  <path d="M288 225H326" class="formal-arrow" />
  <path d="M576 225H614" class="formal-arrow" />
  <path d="M864 225H902" class="formal-arrow" />

  <rect x="180" y="382" width="840" height="116" rx="10" fill="#111827" stroke="#f59e0b" stroke-width="2" />
  <text x="214" y="420" fill="#fbbf24" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="700" letter-spacing="1.5px">REVIEW BOUNDARY</text>
  <text x="214" y="456" class="formal-card-title">Does the checked property express the production requirement?</text>
  <text x="214" y="482" class="formal-small">The checker cannot establish this correspondence.</text>

  <path d="M1032 308V347H1000V372" class="formal-arrow" />
  <path d="M200 382V347H168V308" class="formal-arrow" />
  `,
  550
);

const duplicateTrace = formalShell(
  'The duplicate-effect trace',
  'Both workers observe an incomplete operation before either worker records completion.',
  `
  <rect x="88" y="122" width="180" height="46" rx="7" fill="#111827" stroke="#a78bfa" stroke-width="2" />
  <text x="178" y="151" class="formal-chip" text-anchor="middle">Worker A</text>
  <rect x="346" y="122" width="180" height="46" rx="7" fill="#111827" stroke="#38bdf8" stroke-width="2" />
  <text x="436" y="151" class="formal-chip" text-anchor="middle">Worker B</text>
  <rect x="604" y="122" width="214" height="46" rx="7" fill="#111827" stroke="#34d399" stroke-width="2" />
  <text x="711" y="151" class="formal-chip" text-anchor="middle">effects</text>
  <rect x="896" y="122" width="216" height="46" rx="7" fill="#111827" stroke="#fbbf24" stroke-width="2" />
  <text x="1004" y="151" class="formal-chip" text-anchor="middle">completed</text>

  <path d="M178 168V638" class="formal-lane" />
  <path d="M436 168V638" class="formal-lane" />
  <path d="M711 168V638" class="formal-lane" />
  <path d="M1004 168V638" class="formal-lane" />

  <text x="40" y="218" class="formal-step">t0</text>
  <circle cx="178" cy="212" r="7" fill="#a78bfa" />
  <path d="M188 212H990" class="formal-arrow" />
  <text x="430" y="198" class="formal-card-copy">read completed</text>
  <rect x="912" y="226" width="184" height="38" rx="6" fill="#111827" stroke="#fbbf24" />
  <text x="1004" y="251" class="formal-card-copy" text-anchor="middle">FALSE</text>

  <text x="40" y="322" class="formal-step">t1</text>
  <circle cx="178" cy="316" r="7" fill="#a78bfa" />
  <path d="M188 316H697" class="formal-arrow" />
  <text x="376" y="302" class="formal-card-copy">apply payment</text>
  <rect x="628" y="330" width="166" height="38" rx="6" fill="#111827" stroke="#34d399" />
  <text x="711" y="355" class="formal-card-copy" text-anchor="middle">effects = 1</text>

  <text x="40" y="426" class="formal-step">t2</text>
  <circle cx="436" cy="420" r="7" fill="#38bdf8" />
  <path d="M446 420H990" class="formal-arrow" />
  <text x="646" y="406" class="formal-card-copy">read completed</text>
  <rect x="912" y="434" width="184" height="38" rx="6" fill="#111827" stroke="#fbbf24" />
  <text x="1004" y="459" class="formal-card-copy" text-anchor="middle">still FALSE</text>

  <rect x="32" y="500" width="1136" height="112" rx="8" fill="#1f131a" stroke="#ef4444" stroke-width="2" />
  <text x="54" y="528" fill="#f87171" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="700" letter-spacing="1.5px">SAFETY VIOLATION</text>
  <text x="54" y="570" class="formal-step">t3</text>
  <circle cx="436" cy="564" r="7" fill="#38bdf8" />
  <path d="M446 564H697" class="formal-arrow" />
  <text x="506" y="550" class="formal-card-copy">apply payment</text>
  <rect x="628" y="542" width="166" height="44" rx="6" fill="#2b1118" stroke="#ef4444" stroke-width="2" />
  <text x="711" y="570" fill="#fca5a5" font-family="DejaVu Sans Mono, monospace" font-size="16" font-weight="700" text-anchor="middle">effects = 2</text>
  <text x="824" y="570" fill="#fca5a5" font-family="DejaVu Sans Mono, monospace" font-size="15" font-weight="700">AtMostOnce is false</text>
  <text x="824" y="594" class="formal-small">Completion has not changed.</text>

  <text x="40" y="666" class="formal-step">t4</text>
  <path d="M188 660H990" class="formal-dashed" />
  <text x="482" y="646" class="formal-small">mark completion comes too late</text>
  `,
  700
);

const verificationBoundary = formalShell(
  'What the result covers',
  'A formal result is strong inside its stated boundary. Reviewers must examine what remains outside.',
  `
  <rect x="48" y="126" width="520" height="396" rx="10" class="formal-panel" />
  <rect x="48" y="126" width="8" height="396" fill="#34d399" />
  <text x="82" y="166" fill="#6ee7b7" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="700" letter-spacing="1.5px">CHECKER ESTABLISHES</text>

  <text x="82" y="214" class="formal-card-title">01  Exact artifact</text>
  <text x="118" y="240" class="formal-small">Model, source, bytecode, or proof term</text>
  <path d="M82 260H536" stroke="#263449" stroke-width="1.5" />

  <text x="82" y="304" class="formal-card-title">02  Named property</text>
  <text x="118" y="330" class="formal-small">Invariant, contract, or theorem</text>
  <path d="M82 350H536" stroke="#263449" stroke-width="1.5" />

  <text x="82" y="394" class="formal-card-title">03  Stated scope</text>
  <text x="118" y="420" class="formal-small">Bounds, operations, failures, assumptions</text>
  <path d="M82 440H536" stroke="#263449" stroke-width="1.5" />

  <rect x="82" y="466" width="454" height="34" rx="5" fill="#0f2d28" stroke="#34d399" />
  <text x="309" y="488" fill="#6ee7b7" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="700" text-anchor="middle">counterexample or checked claim</text>

  <rect x="632" y="126" width="520" height="396" rx="10" class="formal-panel" />
  <rect x="1144" y="126" width="8" height="396" fill="#f59e0b" />
  <text x="666" y="166" fill="#fbbf24" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="700" letter-spacing="1.5px">ENGINEERS MUST JUSTIFY</text>

  <text x="666" y="214" class="formal-card-title">01  Theorem selection</text>
  <text x="702" y="240" class="formal-small">Does the property express the requirement?</text>
  <path d="M666 260H1120" stroke="#263449" stroke-width="1.5" />

  <text x="666" y="304" class="formal-card-title">02  Production mapping</text>
  <text x="702" y="330" class="formal-small">Does deployed code implement the artifact?</text>
  <path d="M666 350H1120" stroke="#263449" stroke-width="1.5" />

  <text x="666" y="394" class="formal-card-title">03  Omitted behavior</text>
  <text x="702" y="420" class="formal-small">Failures, time, and external service semantics</text>
  <path d="M666 440H1120" stroke="#263449" stroke-width="1.5" />

  <rect x="666" y="466" width="454" height="34" rx="5" fill="#33240b" stroke="#f59e0b" />
  <text x="893" y="488" fill="#fbbf24" font-family="DejaVu Sans Mono, monospace" font-size="14" font-weight="700" text-anchor="middle">evidence that still needs review</text>

  <path d="M568 324H622" stroke="#60a5fa" stroke-width="3" />
  <rect x="586" y="310" width="18" height="28" fill="#0b1020" />
  <text x="595" y="330" fill="#93c5fd" font-family="DejaVu Sans Mono, monospace" font-size="18" font-weight="700" text-anchor="middle">≠</text>

  <rect x="184" y="564" width="832" height="62" rx="8" fill="#111827" stroke="#60a5fa" stroke-width="2" />
  <text x="600" y="590" class="formal-card-title" text-anchor="middle">Human review connects the result to production.</text>
  <text x="600" y="613" class="formal-small" text-anchor="middle">State assumptions. Explain abstractions. Test the boundary.</text>
  `,
  660
);

await Promise.all([
  writeFile(new URL('s3-control-data-planes.svg', outputRoot), beginner.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('cross-account-kinesis-emr.svg', outputRoot), relay.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('formal-verification-loop.svg', outputRoot), verificationLoop.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('duplicate-effect-trace.svg', outputRoot), duplicateTrace.replace(/[ \t]+$/gm, '')),
  writeFile(new URL('verification-boundary.svg', outputRoot), verificationBoundary.replace(/[ \t]+$/gm, ''))
]);

console.log('Generated 5 self-contained diagrams.');
