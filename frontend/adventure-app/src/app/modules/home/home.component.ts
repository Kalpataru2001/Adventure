// src/app/components/home/home.component.ts

import { Component, OnInit } from '@angular/core';
import { ChallengeService } from 'src/app/services/challenge.service'; // Adjust path if needed
import { NotificationService } from 'src/app/services/notification.service';
import { Challenge } from 'src/app/models/challenge.model'; // <-- 1. Import the Challenge model
import { forkJoin } from 'rxjs'; // <-- 2. Import forkJoin to make parallel API calls
import { HomeStats, ProfileService } from 'src/app/services/profile.service';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // Use the strong type from your model
  challenges: Challenge[] = [];
  homeStats: HomeStats | null = null;
  
  // This will now store the string UUIDs from the database
  acceptedChallengeIds = new Set<string>();
  
  isLoading = true;

  constructor(
    private challengeService: ChallengeService,
    private profileService: ProfileService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    const allChallenges$ = this.challengeService.getChallenges();
    const myCompletions$ = this.challengeService.getMyAcceptedChallengeIds();
    const homeStats$ = this.profileService.getHomeStats();
     forkJoin([allChallenges$, myCompletions$, homeStats$]).subscribe({
      next: ([challenges, acceptedIds, homePageStats]) => {
        this.challenges = challenges;
        this.acceptedChallengeIds = new Set(acceptedIds);

        // Now we assign the renamed variable, which has no conflicts.
        this.homeStats = homePageStats;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load home page data:', err);
        this.notify.error('Could not load adventures. Please try again later.');
        this.isLoading = false;
      }
    });
  }

  // This method now saves the completion to the database.
  onAcceptChallenge(challenge: Challenge): void {
    this.acceptedChallengeIds.add(challenge.id);
    this.challengeService.acceptChallenge(challenge.id).subscribe({
      next: () => {
        this.notify.success(`Challenge "${challenge.title}" accepted!`);
      },
      error: (err) => {
        this.acceptedChallengeIds.delete(challenge.id);
        this.notify.error('Failed to accept challenge. Please try again.');
        console.error(err);
      }
    });
  }

  // This method now correctly checks the dynamic Set of IDs.
  isAccepted(challenge: Challenge): boolean {
    return this.acceptedChallengeIds.has(challenge.id);
  }
}