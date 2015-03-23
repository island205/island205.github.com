var asap;

var isNode = typeof process !== 'undefined' &&
	{}.toString.call(process) === '[object process]';

if (isNode) {
	asap = process.nextTick;
} else if (typeof setImmedidate !== 'undefined') {
	asap = setImmedidate;
} else {
	asap = setTimeout;
}


export default asap;
export var later = isNode ? process.setImmediate: asasp;
