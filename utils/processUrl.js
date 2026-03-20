const Random = require(__dirname+'/Random.js');
module.exports = function processUrl(url) {
    // Génère des mouvements à partir d'une URL.
	// console.log("Calculating from:",url)
    var valid_moves = ["ATK", "DEF", "HUG", "GIV"];
	let monster = null
	if(url.indexOf("monster")!=-1)
		monster = url.split("monster=")[1]
    // var moves = [];

    url = url.toLowerCase();
    var seed = 0;
    var seed_str = url.split("?")[0].split("/")[3];
	
	var moves = url.toUpperCase().split("/");
	// moves.pop()
	
	moves = moves.filter(m=>valid_moves.indexOf(m)!=-1)
	
    if (seed_str.includes("vieord") || seed_str.includes("vixord")) {
        seed_str = "";
    }
    for (var j = 0; j < seed_str.length; j++) {
        var c = seed_str.charAt(j);
        seed = (seed + c.charCodeAt(0)) % 8096;
    }

	// console.log(seed)
    const rand = new Random(seed);
    rand.choice = (array) => {
        return array[Math.floor(rand() * array.length)]
    }
	
	rand.randint = (min,max) => {
        return Math.floor(rand() * (max - min)) + min
    }
	
	rand.integer = (integer1,integer2) => {
		const array = [integer1,integer2]
        return array[Math.floor(rand() * array.length)]
    }

    return [rand,moves,seed_str,monster]
}
