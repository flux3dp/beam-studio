import i18n from '@core/helpers/i18n';

class CalibrationDataMissingError extends Error {
  constructor() {
    super(i18n.lang.message.camera.calibration_data_missing_message);
    this.name = 'CalibrationDataMissingError';
  }
}

export default CalibrationDataMissingError;
