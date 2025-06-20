
export interface Challenge {
  id: string; // The API sends a string UUID
  title: string;
  description: string | null;
  category: string | null;
  difficulty: number | null;
  createdAt: string; 
}
