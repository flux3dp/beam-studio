export default (dataString: string) => {
    const pairs = dataString.split('&');
    const data: { access_token?: string, code?: string } = {};
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        if (pair.length > 1) {
            data[pair[0]] = pair[1];
        }
    }
    return data;
};