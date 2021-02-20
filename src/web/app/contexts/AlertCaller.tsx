import { AlertsAndProgress, AlertsAndProgressContextHelper }  from '../views/dialogs/Alerts-And-Progress';
import { IAlert } from '../../interfaces/IAlert';
const React = requireNode('react');
const electron = requireNode('electron');

export default {
    popUp: (args: IAlert) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popUp(args);
        }
    },
    popById: (id) => {
        if (!AlertsAndProgressContextHelper.context) {
            console.log('Alert context not loaded Yet');
        } else {
            AlertsAndProgressContextHelper.context.popById(id);
        }
    },
    renderHyperLink: (text: string, link: string) => {
        return (
            <div className='hyper-link' onClick={()=>electron.remote.shell.openExternal(link)}>
                {text}
            </div>
        );
    },
};
