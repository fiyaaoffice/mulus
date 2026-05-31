export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
  isOfficial?: boolean;
}

export interface PotholeReport {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  imageUrl: string;
  videoUrl?: string;
  severity: 'low' | 'medium' | 'critical';
  reporterName: string;
  reporterPin?: string;
  createdAt: string;
  status: 'pending' | 'repairing' | 'resolved';
  upvotes: number;
  comments: Comment[];
  roadName: string;
  city: string;
  province: string;
  authorityCategory?: 'pusat' | 'provinsi' | 'kabupaten';
  aiAudit?: {
    summary: string;
    trafficImpact: string;
    estimatedCost: string;
    recommendedMaterial: string;
    estimatedTimeline: string;
    puprResponseCode: string;
  };
}

export interface Statistics {
  totalActive: number;
  totalRepaired: number;
  smoothRoadPercentage: number;
  activeCollaborators: number;
}
