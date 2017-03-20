export default () => {
    const host = 'timolawl-voting.herokuapp.com';
    if ((host == location.host) && (location.protocol != 'https:'))
        location.protocol = 'https';
}
