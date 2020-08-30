/**
 * simply check the string is json format
 */
export default function(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch(e) {
        return false;
    }
};
