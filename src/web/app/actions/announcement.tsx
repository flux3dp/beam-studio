import Modal from '../widgets/Modal'

    const React = requireNode('react');;
    const ReactDOM = requireNode('react-dom');
    
    class Announcement {
        reactRoot: any;
        contents: Map<any, any>;
        init(reactRoot) {
            this.reactRoot = reactRoot;
            this.contents = new Map();
        }

        post(reactComponent, key) {
            if(!key) {
                console.warn('please enter key! announcement.jsx use the key to remove the post in case of there are several posts at the same time');
                return;
            }
            if(this.contents.has(key)) {
                console.warn('duplicate key! announcement.jsx use the key to remove the post in case of there are several posts at the same time');
                return;
            }
            this.contents.set(key, reactComponent);
            this.render();
        }

        unpost(key) {
            this.contents.delete(key);
            this.render();
        }

        stopPropagation(e) {
            console.log('stopPropagation off:', e);
            e.stopPropagation();
        }

        //because this is not a react component, this is not a react render function of course.
        render() {
            if (this.contents.size === 0) {
                ReactDOM.unmountComponentAtNode( document.getElementById(this.reactRoot) );
            } else {
                const content = (
                    <div className='modal-alert'>
                        {[...this.contents.values()]}
                    </div>
                );
                ReactDOM.render(
                    (<div className='always-top'>
                        <Modal
                            className={{'shadow-modal': true, 'camera-calibration': true}}
                            content={content}
                            disabledEscapeOnBackground={false}
                            onKeyDown={this.stopPropagation}
                        />
                    </div>),
                    document.getElementById(this.reactRoot)
                );
            }
        }
    }

    let instance = new Announcement();


    export default instance;
