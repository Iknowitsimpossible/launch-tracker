import { LaunchDetail } from '@/components/LaunchDetail';
import { LaunchList } from '@/components/LaunchList';
import { getNextLaunch, launchData } from '@/lib/launches';

export default function Home() {
  const next = getNextLaunch();

  return (
    <>
      {next ? (
        <LaunchDetail launch={next} eyebrow="Next launch" />
      ) : (
        // Every page needs exactly one h1, even when there is no hero to carry it.
        <h1 className="srOnly">Upcoming and recent rocket launches</h1>
      )}
      <LaunchList
        id="upcoming"
        title="Upcoming"
        launches={launchData.upcoming}
        emptyMessage="No upcoming launches are scheduled right now."
      />
      <LaunchList
        id="recent"
        title="Recent (past month)"
        launches={launchData.recent}
        emptyMessage="No launches in the past month."
      />
    </>
  );
}
