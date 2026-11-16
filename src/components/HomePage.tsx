import { getNextLaunch, launchData } from '@/lib/launches';
import type { Locale } from '@/lib/locale';
import { LaunchDetail } from './LaunchDetail';
import { LaunchList } from './LaunchList';
import { SiteFrame } from './SiteFrame';

export function HomePage({ locale }: { locale: Locale }) {
  const next = getNextLaunch();
  const chinese = locale === 'zh-Hans';

  return (
    <SiteFrame locale={locale} path="/">
      {next ? (
        <LaunchDetail launch={next} eyebrow={chinese ? '下一次发射' : 'Next launch'} locale={locale} />
      ) : (
        <h1 className="srOnly">{chinese ? '即将发射和近期发射' : 'Upcoming and recent rocket launches'}</h1>
      )}
      <LaunchList
        id="upcoming"
        title={chinese ? '即将发射' : 'Upcoming'}
        launches={launchData.upcoming}
        emptyMessage={chinese ? '目前没有已安排的发射。' : 'No upcoming launches are scheduled right now.'}
        locale={locale}
      />
      <LaunchList
        id="recent"
        title={chinese ? '近期发射（过去一个月）' : 'Recent (past month)'}
        launches={launchData.recent}
        emptyMessage={chinese ? '过去一个月没有发射。' : 'No launches in the past month.'}
        locale={locale}
      />
    </SiteFrame>
  );
}
