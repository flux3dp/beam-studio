const requirement = {
  ADOR_FCODE_V3: '5.1.18',
  ADOR_JOB_ORIGIN: '5.3.5',
  ADOR_PWM: '5.3.4',
  ADOR_RELEASE: '5.1.12',
  ADOR_ROTARY: '5.3.2',
  ADOR_STATIC_FILE_ENTRY: '5.1.17',
  B34_LOOSE_MOTOR: '3.3.0',
  BB2_AUTO_EXPOSURE: '6.0.15',
  BB2_SEPARATE_EXPOSURE: '6.0.11',
  BB2_WIDE_ANGLE_CAMERA: '6.0.12',
  BB2_Z_SPEED_TEST: '6.0.10',
  BEAM_STUDIO_2: '3.5.1',
  BEAMBOX_CAMERA_CALIBRATION_XY_RATIO: '1.6.0',
  BEAMBOX_CAMERA_SPEED_UP: '1.4.4',
  BEAMO_ACC_OVERRIDE: '4.3.9',
  BORDERLESS_MODE: '2.5.1',
  CALIBRATION_MODE: '3.5.1',
  CAMERA_SOCKET_EXPOSURE: '6.1.0',
  CLOSE_FAN: '1.4.1',
  CLOUD: '1.5.0',
  DIODE_AND_AUTOFOCUS: '3.0.0',
  FAST_GRADIENT: '3.0.1',
  H_CAM_COMMAND: '6.1.1',
  JOB_ORIGIN: '4.3.5',
  LATEST_GHOST_FOR_WEB: '3.5.2',
  MAINTAIN_WITH_LINECHECK: '3.2.6',
  NEW_PLAYER: '3.3.0',
  OPERATE_DURING_PAUSE: '1.6.20',
  PROMARK_CONTOUR: '1.3.11',
  PROMARK_HULL: '1.4.2',
  PROMARK_ROTARY: '1.3.8',
  PWM: '4.3.4',
  RELOCATE_ORIGIN: '3.2.2',
  SCAN_CALIBRATION: '1.6.9',
  SWIFTRAY_CONNECTION_TEST: '1.3.7',
  SWIFTRAY_CONVERT_PREVIEW: '1.3.7',
  SWIFTRAY_SUPPORT_BINARY: '1.3.7',
  TEMP_I2C_CMD: '3.0.1',
  UPDATE_BY_SOFTWARE: '3.2.6',
  USABLE_VERSION: '1.4.9',
};

export type RequirementKey = keyof typeof requirement;

// 1.7.0 > 1.5.0 > 1.5b12 > 1.5a12
export default (sourceVersion: string): { meetRequirement: (key: RequirementKey) => boolean } => {
  const currentVersion = sourceVersion.split('.');
  const meetVersion = (targetVersion: string | string[]) => {
    targetVersion = typeof targetVersion === 'string' ? targetVersion.split('.') : targetVersion;

    // Compare first version number
    if (Number.parseInt(targetVersion[0], 10) !== Number.parseInt(currentVersion[0], 10)) {
      return Number.parseInt(targetVersion[0], 10) < Number.parseInt(currentVersion[0], 10);
    }

    const targetMinorVersion = targetVersion[1].split(/[ab]/);
    const currentMinorVersion = currentVersion[1].split(/[ab]/);

    // Compare second version number - Adapt with 1.5b12 style.
    // Crashes when beta / alpha version number exceed 40000
    if (Number.parseInt(targetVersion[1] || '0', 10) >= 40000) {
      throw new Error('Second version number overflow, should be < 40000');
    }

    if (Number.parseInt(currentMinorVersion[1] || '0', 10) >= 40000) {
      throw new Error('Second version number overflow, should be < 40000');
    }

    let targetMinorScore =
      Number.parseInt(targetMinorVersion[0], 10) * 120000 - Number.parseInt(targetMinorVersion[1] || '0', 10);
    let currentMinorScore =
      Number.parseInt(currentMinorVersion[0], 10) * 120000 - Number.parseInt(currentMinorVersion[1] || '0', 10);

    if (targetVersion[1].includes('a')) {
      targetMinorScore -= 80000;
    } // Alpha Version => Score -80000

    if (targetVersion[1].includes('b')) {
      targetMinorScore -= 40000;
    } // Beta Version => Score -40000

    if (currentVersion[1].includes('a')) {
      currentMinorScore -= 80000;
    }

    if (currentVersion[1].includes('b')) {
      currentMinorScore -= 40000;
    }

    if (targetMinorScore === currentMinorScore) {
      return Number.parseInt(targetVersion[2] || '0', 10) <= Number.parseInt(currentVersion[2] || '0', 10);
    }

    return targetMinorScore < currentMinorScore;
  };

  const meetRequirement = (key: RequirementKey) => meetVersion(requirement[key]);

  return {
    meetRequirement,
  };
};
