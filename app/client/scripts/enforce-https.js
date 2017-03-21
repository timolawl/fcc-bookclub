export default () => {
    const host = 'timolawl-bookclub.herokuapp.com';
    if ((host == location.host) && (location.protocol != 'https:'))
        location.protocol = 'https';
}
