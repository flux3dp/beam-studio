let resultCache = null;

const checkQuestionnaire = async () => {
    if (resultCache) return resultCache;

    let res;
    try {
        res = await $.ajax({
            url: 'https://flux3dp.com/api_entry/',
            data: {
                key: 'beam-studio-qustionnaire',
            }
        });
    } catch {
        return null;
    }
    resultCache = res;
    return res;
}

export default checkQuestionnaire;