/* 
  The aim here is to *simulate* a cache layer for the application. This is likely a suboptimal solution
  for this code. In a real world application something like Redis would be far better. That'd have the 
  benefit of sharing the failure count in a system where we have multiple replicas running, as well as
  being fault tolerant in the case that the replica gets killed and restarted for any reason
*/

export class FailoverService {
  private failureCount = 0;
  private totalCount = 0;
  private failoverTriggered = false;
  private resetTimeout?: NodeJS.Timeout;

  public calculateFailureRate(): number {
    if (this.totalCount === 0) return 0;
    return this.failureCount / this.totalCount;
  }

  public recordRequest() {
    this.totalCount++;
  }

  public recordFailure() {
    this.failureCount++;
    this.totalCount++;
  }

  public isFailoverRequired(): boolean {
    const failoverNeeded = this.calculateFailureRate() > 0.5;

    /*
      Again, this solution is somewhat suboptimal. We'd likely want to use something like cron job (perhaps triggered in
      a serverless function) to manage the timeout logic for this code. That'd has very similar benefits to using Redis
      for keeping track of the error rate: The time gets shared within a distrubuted system and is tolerant to restarts
    */
    if (failoverNeeded && !this.failoverTriggered) {
      this.failoverTriggered = true;
      
      this.resetTimeout = setTimeout(() => {
        this.failureCount = 0;
        this.totalCount = 0;
        this.failoverTriggered = false;
      }, 5 * 60 * 1000);
    }

    return failoverNeeded;
  }
}
