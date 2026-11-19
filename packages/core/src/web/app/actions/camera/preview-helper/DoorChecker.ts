import alertCaller from '@core/app/actions/alert-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

class DoorChecker {
  public keepClosed = false;
  private timer: NodeJS.Timeout | null = null;

  checkDoorClosed = async (showError = false): Promise<boolean> => {
    let isDoorClosed: boolean;

    if (deviceMaster.currentControlMode === 'raw') {
      const { interlock } = await deviceMaster.rawGetDoorOpen();

      isDoorClosed = interlock === 0;
    } else {
      const res = await deviceMaster.getDoorOpen();

      isDoorClosed = res.value === '0';
    }

    if (!isDoorClosed) {
      this.keepClosed = false;
      this.stopDoorCheck();

      if (showError) {
        alertCaller.popUpError({
          caption: i18n.lang.message.camera.door_opened,
          message: i18n.lang.message.camera.door_opened_text,
        });
      }
    }

    return isDoorClosed;
  };

  stopDoorCheck = (): void => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  startDoorCheck = (): void => {
    this.keepClosed = true;
    this.stopDoorCheck();

    let isChecking = false;

    this.timer = setInterval(async () => {
      // A check can hang until the 10s control timeout; don't pile more onto the device task queue meanwhile
      if (isChecking) return;

      isChecking = true;

      try {
        await this.checkDoorClosed();
      } catch (error) {
        console.error('Fail to check door', error);
      } finally {
        isChecking = false;
      }
    }, 1000);
  };

  doorClosedWrapper = async (callback: () => Promise<boolean>, showError = true): Promise<boolean> => {
    this.stopDoorCheck();

    let res = await this.checkDoorClosed(showError);

    if (!res) return res;

    res = await callback();

    if (!res) return res;

    this.startDoorCheck();

    res = await this.checkDoorClosed(showError);

    return res;
  };

  destroy = this.stopDoorCheck;
}

export default DoorChecker;
