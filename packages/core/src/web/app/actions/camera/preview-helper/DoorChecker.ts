import alertCaller from '@core/app/actions/alert-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

class DoorChecker {
  public keepClosed = false;
  private timer: NodeJS.Timeout | null = null;

  checkDoorClosed = async (showError = false): Promise<boolean> => {
    const res = await deviceMaster.getDoorOpen();
    const isDoorClosed = res.value === '0';

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
    this.timer = setInterval(async () => {
      await this.checkDoorClosed();
    }, 1000);
  };

  doorClosedWrapper = async (callback: () => Promise<any>): Promise<boolean> => {
    this.stopDoorCheck();

    let res = await this.checkDoorClosed(true);

    if (!res) return res;

    res = await callback();

    if (!res) return res;

    this.startDoorCheck();

    res = await this.checkDoorClosed(true);

    return res;
  };

  destroy = this.stopDoorCheck;
}

export default DoorChecker;
