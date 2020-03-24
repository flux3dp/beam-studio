define([
    'helpers/i18n'
], function(
    i18n
) {
    const React = require('react');

    let lang = i18n.get();

    return class WaitWording extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                str,
                counter: 0
            };
        }

        componentDidMount = () => {
            let { interval } = this.props;


            setInterval(() => {
                this.setState(this.next());
            }, interval || 1000);
        }

        next = () => {
            let { animationString, interval } = this.props,
                { counter } = this.state,
                arr, str;

            animationString = animationString || '...';
            interval = interval || 1000;
            str = animationString.split('').slice(0, this.state.counter).join('');
            counter = (counter + 1) % (animationString.length + 1) === 0 ? 0 : counter + 1;
            return {
                str, counter
            }
        }

        render() {
            return (
                <div className="processing">
                    <label>{lang.general.wait + this.state.str}</label>
                </div>
            );
        }
    };
});
