import React, { useState } from 'react';
import {
  Layers,
  Server,
  Database,
  Cpu,
  Globe,
  HardDrive,
  Radio,
  FileCode2,
  Copy,
  Check,
  Calculator,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ComponentBlock {
  id: string;
  name: string;
  category: 'Edge & Network' | 'Compute' | 'Storage' | 'Async';
  icon: React.FC<{ className?: string }>;
  description: string;
}

const ARCH_COMPONENTS: ComponentBlock[] = [
  { id: 'cdn', name: 'CDN / Cloudflare', category: 'Edge & Network', icon: Globe, description: 'Edge caching for static assets & low-latency TLS' },
  { id: 'lb', name: 'Load Balancer (Envoy/NGINX)', category: 'Edge & Network', icon: Server, description: 'Layer 7 load balancing & health checking' },
  { id: 'gateway', name: 'API Gateway', category: 'Edge & Network', icon: Layers, description: 'Authentication, rate limiting, and route dispatching' },
  { id: 'microservice', name: 'App Microservice', category: 'Compute', icon: Cpu, description: 'Stateless REST / gRPC application worker nodes' },
  { id: 'cache', name: 'Redis Cache Cluster', category: 'Storage', icon: HardDrive, description: 'Sub-millisecond in-memory cache with LRU eviction' },
  { id: 'sql_db', name: 'PostgreSQL Primary / Replica', category: 'Storage', icon: Database, description: 'ACID transactional store with read replicas' },
  { id: 'nosql_db', name: 'Cassandra / DynamoDB', category: 'Storage', icon: Database, description: 'High-throughput horizontally partitioned NoSQL' },
  { id: 'queue', name: 'Apache Kafka / RabbitMQ', category: 'Async', icon: Radio, description: 'Distributed commit log for asynchronous workflows' },
  { id: 's3', name: 'S3 / Object Store', category: 'Storage', icon: HardDrive, description: 'Durable blob storage for media and video assets' },
];

const PRESET_TEMPLATES = [
  {
    id: 'tinyurl',
    title: 'URL Shortener (TinyURL)',
    qps: '50,000 Reads/sec | 5,000 Writes/sec',
    storage: '~15 TB / 5 years',
    diagram: `[User Request]
       │
       ▼
[Cloudflare CDN]
       │
       ▼
[Load Balancer (NGINX)]
       │
       ▼
[URL Shortening Service (Go/Node.js)]
    ├──► [Redis Cache (Hot Keys / LRU)]
    ├──► [PostgreSQL (Base62 URL Mappings)]
    └──► [Kafka Queue] ──► [Analytics & Click Tracker]`,
  },
  {
    id: 'chat',
    title: 'Real-time Chat (WhatsApp)',
    qps: '100,000 Messages/sec',
    storage: '~50 TB / month',
    diagram: `[Mobile / Web Client]
       │ (WebSocket Connection)
       ▼
[WebSocket Gateway Cluster]
       │
       ├──► [User Presence Service (Redis)]
       ├──► [Message Router Service]
       │         │
       │         ├──► [Kafka Cluster (Partitioned by ChatId)]
       │         │          ▼
       │         │    [Message Persistence Worker]
       │         │          ▼
       │         │    [Cassandra / ScyllaDB Message Store]
       │         ▼
       └──► [Push Notification Service (APNs / FCM)]`,
  },
  {
    id: 'streaming',
    title: 'Video Streaming (Netflix/YouTube)',
    qps: '1,000,000 Concurrent Streams',
    storage: '~10 PB Catalog',
    diagram: `[Candidate / Client App]
       │ (Video Stream Playback)
       ├──► [Anycast CDN Edge Caches (HLS / DASH video chunks)]
       │
       │ (API & Metadata Queries)
       ▼
[API Gateway] ──► [Catalog Service] ──► [DynamoDB + Redis]
       │
       ▼ (Video Upload Pipeline)
[Transcoding Service] ──► [FFmpeg Workers] ──► [S3 Raw / Transcoded]`,
  },
];

export const SystemDesignWorkspace: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('tinyurl');
  const [architectureNotes, setArchitectureNotes] = useState<string>(() => PRESET_TEMPLATES[0].diagram);
  const [copied, setCopied] = useState<boolean>(false);

  // Capacity Calculator state
  const [dailyActiveUsers, setDailyActiveUsers] = useState<number>(50); // millions
  const [actionsPerUser, setActionsPerUser] = useState<number>(10);
  const [payloadKb, setPayloadKb] = useState<number>(2);

  const totalRequestsDay = dailyActiveUsers * 1000000 * actionsPerUser;
  const avgQps = Math.round(totalRequestsDay / 86400);
  const peakQps = avgQps * 2;
  const dailyStorageGb = Math.round((totalRequestsDay * payloadKb) / (1024 * 1024));

  const handleApplyTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = PRESET_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setArchitectureNotes(tmpl.diagram);
    }
  };

  const handleAddComponent = (comp: ComponentBlock) => {
    setArchitectureNotes((prev) => `${prev}\n\n[Component: ${comp.name}]\n- Role: ${comp.description}\n- Tier: ${comp.category}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(architectureNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden select-none">
      {/* Header Toolbar */}
      <div className="h-12 border-b border-gray-800 bg-gray-900/90 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white tracking-tight uppercase">System Design Whiteboard</h2>
        </div>

        {/* Template Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {PRESET_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleApplyTemplate(t.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                selectedTemplate === t.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t.title.split(' ')[0]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800 overflow-hidden min-h-0">
        {/* Left Column: Component Palette & Back-of-the-Envelope Calculator */}
        <div className="h-full overflow-y-auto p-4 space-y-4 bg-gray-900/30 text-xs">
          {/* Quick Component Palette */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Architectural Components</span>
            </h3>
            <p className="text-[10px] text-gray-500 mb-2">Click any component to append to your whiteboard:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {ARCH_COMPONENTS.map((comp) => {
                const Icon = comp.icon;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleAddComponent(comp)}
                    className="flex items-start gap-2 p-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-left transition cursor-pointer group"
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 text-gray-400 group-hover:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-200 group-hover:text-white truncate">
                        {comp.name}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate">{comp.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Back of Envelope Calculator */}
          <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2.5">
            <h4 className="font-semibold text-gray-200 flex items-center gap-1.5 text-[11px]">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scale & Capacity Estimator</span>
            </h4>

            <div className="space-y-1.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>Daily Active Users (DAU):</span>
                <span className="font-mono text-white font-semibold">{dailyActiveUsers}M</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={dailyActiveUsers}
                onChange={(e) => setDailyActiveUsers(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <span>Actions / User / Day:</span>
                <span className="font-mono text-white font-semibold">{actionsPerUser}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={actionsPerUser}
                onChange={(e) => setActionsPerUser(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Calculated Metrics */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-800 text-[10px] font-mono">
              <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800">
                <p className="text-gray-500">Average QPS</p>
                <p className="text-blue-400 font-semibold">{avgQps.toLocaleString()}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800">
                <p className="text-gray-500">Peak QPS (2x)</p>
                <p className="text-indigo-400 font-semibold">{peakQps.toLocaleString()}</p>
              </div>
              <div className="col-span-2 p-1.5 rounded-lg bg-gray-950 border border-gray-800">
                <p className="text-gray-500">Daily Ingestion Storage</p>
                <p className="text-emerald-400 font-semibold">~{dailyStorageGb} GB / Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Editable Architecture Notes & Diagram */}
        <div className="col-span-2 h-full flex flex-col p-4 bg-gray-950/80 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Architecture Whiteboard & Dataflow Schema
            </span>
            <span className="text-[10px] text-gray-500">Plain text / ASCII / Markdown supported</span>
          </div>
          <textarea
            value={architectureNotes}
            onChange={(e) => setArchitectureNotes(e.target.value)}
            placeholder="Diagram your system architecture components, database schemas, and data pipelines here..."
            spellCheck={false}
            className="flex-1 w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none leading-relaxed select-text"
          />
        </div>
      </div>
    </div>
  );
};

