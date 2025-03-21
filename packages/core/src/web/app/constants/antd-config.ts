import type { ThemeConfig } from 'antd';

export const iconButtonTheme: ThemeConfig = {
  components: {
    Button: {
      // icon color
      colorText: '#494949',
      colorTextDisabled: '#CECECE',
      // button size
      controlHeight: 24,
      // icon size
      fontSize: 24,
      lineHeight: 1,
      // border
      lineWidth: 0,
    },
  },
};

export const textButtonTheme: ThemeConfig = {
  components: {
    Button: {
      // icon and text color
      colorText: '#333333',
      colorTextDisabled: '#B9B9B9',
      // button size
      controlHeight: 30,
      // icon size
      fontSize: 24,
      lineHeight: 1,
      // margin between icon and text
      marginXS: 4,
    },
  },
};

export const sliderTheme: ThemeConfig = {
  token: {
    // track background when hovered
    colorFillSecondary: '#E0E0DF',
    // track background
    colorFillTertiary: '#E0E0DF',
  },
};

export const selectTheme: ThemeConfig = {
  components: {
    Select: {
      borderRadius: 0,
      colorBgContainer: 'transparent',
      colorBgContainerDisabled: 'transparent',
      controlHeight: 24,
      // box shadow
      controlOutline: 'transparent',
    },
  },
};

export const underlineInputTheme: ThemeConfig = {
  components: {
    InputNumber: {
      activeShadow: 'none',
      controlWidth: 70,
    },
  },
  token: {
    colorBgContainer: 'transparent',
    colorBgContainerDisabled: 'transparent',
    controlPaddingHorizontal: 6,
    fontSize: 14,
    lineWidth: 0,
  },
};

export const objectPanelInputTheme: ThemeConfig = {
  components: {
    InputNumber: {
      activeShadow: 'none',
      controlWidth: 66,
    },
  },
  token: {
    colorBgContainer: 'transparent',
    colorBgContainerDisabled: 'transparent',
    controlPaddingHorizontal: 6,
    fontSize: 12,
    lineWidth: 0,
  },
};

export const configPanelInputTheme: ThemeConfig = {
  components: {
    InputNumber: {
      activeShadow: 'none',
      controlWidth: 80,
    },
  },
  token: {
    colorBgContainer: 'transparent',
    colorBgContainerDisabled: 'transparent',
    fontSize: 13,
    lineWidth: 0,
  },
};

export const ConfigModalBlock: ThemeConfig = {
  components: {
    InputNumber: {
      activeBorderColor: '#cecece',
      activeShadow: 'none',
      controlWidth: 40,
      hoverBorderColor: '#cecece',
    },
    Slider: {
      handleLineWidth: 2,
      handleLineWidthHover: 2,
      handleSize: 10,
      handleSizeHover: 10,
      railSize: 6,
    },
  },
  token: {
    colorBgContainerDisabled: 'transparent',
    lineWidth: 0,
  },
};

export const ColorRatioModalBlock: ThemeConfig = {
  ...ConfigModalBlock,
  components: {
    ...ConfigModalBlock.components,
    Slider: {
      ...ConfigModalBlock.components.Slider,
      dotActiveBorderColor: '#494949',
      handleActiveColor: '#494949',
      handleColor: '#cecece',
      trackBg: 'transparent',
      trackBgDisabled: 'transparent',
      trackHoverBg: 'transparent',
    },
  },
  token: {
    colorBgContainerDisabled: 'transparent',
    colorPrimary: '#494949',
    colorPrimaryBorder: '#cecece',
    colorPrimaryBorderHover: '#494949',
    lineWidth: 0,
  },
};
