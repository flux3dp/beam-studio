import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import GridGuide from '@core/app/components/welcome/GridGuide';

import styles from './TabHelpCenter.module.scss';
import ThemedButton from './ThemedButton';

const guides = [
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
  {
    category: 10647778378639,
    name: 'Beambox II Guide',
    src: 'https://s3-alpha-sig.figma.com/img/2c78/dd6b/8deeb7a7b23fd656c661e37e77a0efbe?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=X4QVOtKC3Vwwgs8Ja9o~kJmRGxjbaZzb9ccPWaK0sxFC8rN4lOKukJ9q73lOBaxWLp6jz1X0oqsTcNVd2t6Tu2sszJ8hiB4kD9bnarxdKRFve2kMTHOwkodQHcDnYbeGlyXxw2ghee4zEEE-1m-gzYyvSiEkaCuKqwrG2lrvcA9VRUNCq3SShYTm3kwvmbXEa4LFfwJuUOIZE8aQjUWlTTEO~mAgobKpoNZfEKw0QshQ7eau2OC1aqWTjIJZZV3lbzY7u2PANJCCBc5SUnJakJVRHjqGR-PMj5EO2Wj4FPn0-3BPgrvi6FsfxQgqs15N1g9vV~0zB3DmumN4g1ZNmA__',
  },
];

const TabHelpCenter = () => {
  return (
    <div>
      <div className={styles.title}>
        <QuestionCircleOutlined /> Help Center
      </div>
      <div className={styles.subtitle}>Guides, manuals, and support resources for all things FLUX.</div>
      <div className={classNames(styles.content, styles.buttons)}>
        <ThemedButton theme="yellow">Visit Help Center</ThemedButton>
        <ThemedButton theme="black">Submit a Request</ThemedButton>
      </div>
      {/* <div className={styles.title}>Beami, Your AI Assistant</div>
      <div className={styles.subtitle}>
        I can answer your questions about FLUX laser cutters, troubleshooting, and Beam Studio!
      </div>
      <div className={styles.content}>
        <ConfigProvider
          theme={{
            components: { Button: { fontWeight: 700 } },
            token: { controlHeight: 48, fontSize: 16 },
          }}
        >
          <Button className={styles.gradient} type="primary">
            Ask Beami a Question
          </Button>
        </ConfigProvider>
      </div> */}
      <div className={styles.title}>Guides</div>
      <div className={styles.subtitle}>View comprehensive guides for all FLUX products.</div>
      <div className={classNames(styles.content, styles.grids)}>
        {guides.map((guide) => (
          <GridGuide guide={guide} key={guide.category} />
        ))}
      </div>
    </div>
  );
};

export default TabHelpCenter;
