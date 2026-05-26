export interface HintConfig {
  animated?: boolean;
  borderRadius: string;
  height: string;
  margin: string;
  mobile?: {
    borderRadius?: string;
    height?: string;
    margin?: string;
    width?: string;
  };
  width: string;
}

// Network page hints (ConnectWiFi, ConnectWired)
export const defaultNetworkHint: HintConfig = {
  animated: true,
  borderRadius: '61px',
  height: '122px',
  margin: '210px 0 0 -6px',
  mobile: { height: '70px', margin: '128px 0 0 -55px', width: '70px' },
  width: '122px',
};

const adorImgW = 'min(400px, calc(100vw - 450px))';
const adorMobileImgW = '(100vw - 60px)';

export const adorNetworkHint: HintConfig = {
  animated: true,
  borderRadius: '50%',
  height: `calc(0.25 * ${adorImgW})`,
  margin: `calc(0.34 * ${adorImgW}) 0 0 calc(-0.03 * ${adorImgW})`,
  mobile: {
    height: `calc(0.15 * ${adorMobileImgW})`,
    margin: `calc(0.39 * ${adorMobileImgW}) 0 0 calc(-0.81 * ${adorMobileImgW})`,
    width: `calc(0.15 * ${adorMobileImgW})`,
  },
  width: `calc(0.25 * ${adorImgW})`,
};

export const nxNetworkHint: HintConfig = {
  animated: true,
  borderRadius: '50%',
  height: '90px',
  margin: '188px 0 0 8px',
  mobile: { height: '41.25px', margin: '110px 0 0 -52px', width: '41.25px' },
  width: '90px',
};

// IP page hints (ConnectMachineIp)
export const defaultIpHint: HintConfig = {
  borderRadius: '10px',
  height: '20px',
  margin: '74px 0 0 0',
  mobile: { height: '14px', margin: '44px 0 0 -38px', width: '80px' },
  width: '160px',
};

export const defaultIpWiredHint: HintConfig = {
  ...defaultIpHint,
  margin: '122px 0 0 -10px',
  mobile: { height: '14px', margin: '73px 0 0 -38px', width: '80px' },
};

export const adorIpHint: HintConfig = {
  borderRadius: `calc(0.05 * ${adorImgW})`,
  height: `calc(0.05 * ${adorImgW})`,
  margin: `calc(0.18 * ${adorImgW}) 0 0 calc(0.18 * ${adorImgW})`,
  mobile: {
    height: `calc(0.05 * ${adorMobileImgW})`,
    margin: `calc(0.18 * ${adorMobileImgW}) 0 0 calc(-0.25 * ${adorMobileImgW})`,
    width: `calc(0.35 * ${adorMobileImgW})`,
  },
  width: `calc(0.4 * ${adorImgW})`,
};

export const adorIpWiredHint: HintConfig = {
  ...adorIpHint,
  margin: `calc(0.295 * ${adorImgW}) 0 0 calc(0.18 * ${adorImgW})`,
  mobile: {
    ...adorIpHint.mobile,
    margin: `calc(0.295 * ${adorMobileImgW}) 0 0 calc(-0.25 * ${adorMobileImgW})`,
  },
};

export const nxIpHint: HintConfig = {
  borderRadius: '10px',
  height: '20px',
  margin: '65px 0 0 0',
  mobile: { height: '16px', margin: '34.5px 0 0 0', width: '110px' },
  width: '160px',
};
