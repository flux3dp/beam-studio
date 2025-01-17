import { ThemeConfig } from 'antd';

export const iconButtonTheme: ThemeConfig = {
  components: {
    Button: {
      // button size
      controlHeight: 24,
      // icon size
      fontSize: 24,
      lineHeight: 1,
      // icon color
      colorText: '#494949',
      colorTextDisabled: '#CECECE',
      // border
      lineWidth: 0,
    },
  },
};

export const textButtonTheme: ThemeConfig = {
  components: {
    Button: {
      // button size
      controlHeight: 30,
      // icon size
      fontSize: 24,
      lineHeight: 1,
      // icon and text color
      colorText: '#333333',
      colorTextDisabled: '#B9B9B9',
      // margin between icon and text
      marginXS: 4,
    },
  },
};

export const sliderTheme: ThemeConfig = {
  token: {
    // track background
    colorFillTertiary: '#E0E0DF',
    // track background when hovered
    colorFillSecondary: '#E0E0DF',
  },
};

export const selectTheme: ThemeConfig = {
  components: {
    Select: {
      controlHeight: 24,
      colorBgContainer: 'transparent',
      colorBgContainerDisabled: 'transparent',
      borderRadius: 0,
      // box shadow
      controlOutline: 'transparent',
    },
  },
};

export const underlineInputTheme: ThemeConfig = {
  token: {
    lineWidth: 0,
    colorBgContainer: 'transparent',
    colorBgContainerDisabled: 'transparent',
    controlPaddingHorizontal: 6,
    fontSize: 14,
  },
  components: {
    InputNumber: {
      activeShadow: 'none',
      controlWidth: 70,
    },
  },
};

export const objectPanelInputTheme: ThemeConfig = {
  token: {
    lineWidth: 0,
    colorBgContainer: 'transparent',
    colorBgContainerDisabled: 'transparent',
    controlPaddingHorizontal: 6,
    fontSize: 12,
  },
  components: {
    InputNumber: {
      activeShadow: 'none',
      controlWidth: 66,
    },
  },
};

export const ConfigModalBlock: ThemeConfig = {
  token: {
    colorBgContainerDisabled: 'transparent',
    lineWidth: 0,
  },
  components: {
    InputNumber: {
      activeShadow: 'none',
      activeBorderColor: '#cecece',
      hoverBorderColor: '#cecece',
      controlWidth: 40,
    },
    Slider: {
      railSize: 6,
      handleLineWidth: 2,
      handleLineWidthHover: 2,
      handleSize: 10,
      handleSizeHover: 10,
    },
  },
};

export const ColorRatioModalBlock: ThemeConfig = {
  ...ConfigModalBlock,
  token: {
    colorPrimaryBorder: '#cecece',
    colorPrimaryBorderHover: '#494949',
    colorPrimary: '#494949',
    colorBgContainerDisabled: 'transparent',
    lineWidth: 0,
  },
  components: {
    ...ConfigModalBlock.components,
    Slider: {
      ...ConfigModalBlock.components.Slider,
      handleColor: '#cecece',
      handleActiveColor: '#494949',
      dotActiveBorderColor: '#494949',
      trackBg: 'transparent',
      trackBgDisabled: 'transparent',
      trackHoverBg: 'transparent',
    }
  },
};
