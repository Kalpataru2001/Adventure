// This model represents an active, booked challenge.
export interface ActiveChallenge {
  completionId: string;
  challengeId: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
}