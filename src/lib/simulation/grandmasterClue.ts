import { randInt } from 'e';
import { Bank } from 'oldschooljs';
import { EliteClueTable } from 'oldschooljs/dist/simulation/clues/Elite';
import { HardClueTable } from 'oldschooljs/dist/simulation/clues/Hard';
import { MasterClueTable } from 'oldschooljs/dist/simulation/clues/Master';
import Clue from 'oldschooljs/dist/structures/Clue';
import LootTable from 'oldschooljs/dist/structures/LootTable';

import { LampTable } from '../xpLamps';
import CrystalChestTable from './crystalChest';
import { AllBarrows } from './sharedTables';

const ClueHunterTable = new LootTable()
	.add('Helm of raedwald')
	.add('Clue hunter garb')
	.add('Clue hunter gloves')
	.add('Clue hunter trousers')
	.add('Clue hunter boots')
	.add('Clue hunter cloak');

const ClueTable = new LootTable()
	.add('Clue scroll (beginner)')
	.add('Clue scroll (easy)')
	.add('Clue scroll (medium)')
	.add('Clue scroll (hard)')
	.add('Clue scroll (elite)')
	.add('Clue scroll (master)')
	.add(MasterClueTable)
	.add(EliteClueTable)
	.add(HardClueTable);

const BlessingTable = new LootTable().add('Dwarven blessing').add('Monkey nuts');

const DragonTable = new LootTable()
	.add('Dragon boots (g)', [1, 3])
	.add('Dragon platebody (g)', [1, 3])
	.add('Dragon kiteshield (g)', [1, 3])
	.add('Dragon platelegs (g)', [1, 3])
	.add('Dragon chainbody (g)', [1, 3])
	.add('Dragon plateskirt (g)', [1, 3])
	.add('Dragon full helm (g)', [1, 3])
	.add('Dragon sq shield (g)', [1, 3])
	.add('Dragon sword', [1, 5], 2)
	.add('Dragon sword', [1, 5], 2)
	.add('Dragon boots', [1, 5], 2)
	.add('Dragon pickaxe', [1, 5], 2)
	.add('Dragon scimitar', [1, 5], 2)
	.add('Dragon platelegs', [1, 5], 2)
	.add('Dragon chainbody', [1, 5])
	.add('Dragon mace', [1, 5], 2)
	.add('Dragon battleaxe', [1, 5], 2)
	.add('Dragon plateskirt', [1, 5], 2);

const boxTable = new LootTable()
	.add('Tradeable mystery box', [1, 2], 6)
	.add('Untradeable mystery box', 1, 2)
	.add('Pet mystery box');

const runeTable = new LootTable()
	.add('Nature rune', [100, 500])
	.add('Law rune', [100, 500])
	.add('Death rune', [100, 500])
	.add('Blood rune', [100, 500])
	.add('Soul rune', [100, 500])
	.add('Wrath rune', [100, 500])
	.add('Astral rune', [100, 500]);

const PlankTable = new LootTable()
	.add('Oak plank', [100, 400])
	.add('Teak plank', [50, 200])
	.add('Mahogany plank', [20, 120]);

const Supplies = new LootTable()
	.add('Gingerbread gnome', [3, 5])
	.add('Shark', [155, 322])
	.add('Bucket of sand', [200, 2000])
	.add('Purple sweets', [50, 210]);

const table = new LootTable()
	.tertiary(90, ClueHunterTable)
	.tertiary(270, BlessingTable)
	.tertiary(300, 'Nuts of monkey')
	.add(ClueTable)
	.add(boxTable, 1, 2)
	.add(DragonTable, [1, 2], 2)
	.add(runeTable)
	.add('Coins', [5_000_000, 20_000_000])
	.add(LampTable)

	.add(AllBarrows)
	.add(PlankTable)
	// Supplies
	.add(Supplies, 1, 3)
	.add(CrystalChestTable, [5, 10]);

class GrandmasterClue extends Clue {
	open(quantity: number) {
		const loot = new Bank();

		for (let i = 0; i < quantity; i++) {
			const numberOfRolls = randInt(2, 4);

			for (let i = 0; i < numberOfRolls; i++) {
				loot.add(table.roll());
			}
		}

		return loot.values();
	}
}

export const GrandmasterClueTable = new GrandmasterClue({ table });