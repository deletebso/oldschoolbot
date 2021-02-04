import { CommandStore, KlasaMessage } from 'klasa';
import { table } from 'table';

import { Activity, Time } from '../../lib/constants';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import { Enchantables } from '../../lib/skilling/skills/magic/enchantables';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { EnchantingActivityTaskOptions } from '../../lib/types/minions';
import { formatDuration, itemNameFromID, stringMatches } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import { determineRunes } from '../../lib/util/determineRunes';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			altProtection: true,
			oneAtTime: true,
			cooldown: 1,
			usage: '[quantity:int{1}|name:...string] [name:...string]',
			usageDelim: ' ',
			description: 'Sends your minion to enchant items with Magic.',
			examples: ['+enchant 100 opal bolts', '+enchant onyx amulet'],
			categoryFlags: ['minion', 'skilling']
		});
	}

	@minionNotBusy
	@requiresMinion
	async run(msg: KlasaMessage, [quantity, name = '']: [null | number | string, string]) {
		let timeToEnchantTen = 3 * Time.Second * 0.6 + Time.Second / 4;

		if (msg.flagArgs.items) {
			const tableStr = table([
				['Item Name', 'Lvl', 'XP', 'Items Required', 'Items Given', 'XP/Hr'],
				...Enchantables.sort((a, b) => b.level - a.level).map(en => [
					en.name,
					en.level,
					en.xp,
					en.input,
					en.output,
					`${Math.round(
						((en.xp * Time.Hour) / timeToEnchantTen / (Time.Hour / Time.Minute)) * 60
					).toLocaleString()}`
				])
			]);
			return msg.channel.sendFile(Buffer.from(tableStr), 'enchantables.txt');
		}

		if (typeof quantity === 'string') {
			name = quantity;
			quantity = null;
		}

		const enchantable = Enchantables.find(
			item => stringMatches(item.name, name) || stringMatches(itemNameFromID(item.id)!, name)
		);

		if (!enchantable) {
			return msg.send(
				`That is not a valid item to enchant, the items you can enchant are: ${Enchantables.map(
					i => i.name
				).join(', ')}.`
			);
		}

		if (msg.author.skillLevel(SkillsEnum.Magic) < enchantable.level) {
			return msg.send(
				`${msg.author.minionName} needs ${enchantable.level} Magic to enchant ${enchantable.name}.`
			);
		}

		await msg.author.settings.sync(true);
		const userBank = msg.author.bank();

		if (quantity === null) {
			quantity = Math.floor(msg.author.maxTripLength / timeToEnchantTen);
			const spellRunes = determineRunes(msg.author, enchantable.input.clone());
			const max = userBank.fits(spellRunes);
			if (max < quantity && max !== 0) quantity = max;
		}

		const duration = quantity * timeToEnchantTen;

		if (duration > msg.author.maxTripLength) {
			return msg.send(
				`${msg.author.minionName} can't go on trips longer than ${formatDuration(
					msg.author.maxTripLength
				)}, try a lower quantity. The highest amount of ${
					enchantable.name
				}s you can enchant is ${Math.floor(msg.author.maxTripLength / timeToEnchantTen)}.`
			);
		}

		const cost = determineRunes(msg.author, enchantable.input.clone().multiply(quantity));

		if (!userBank.has(cost.bank)) {
			return msg.send(
				`You don't have the materials needed to enchant ${quantity}x ${
					enchantable.name
				}, you need ${enchantable.input}, you're missing **${cost
					.clone()
					.remove(userBank)}**.`
			);
		}
		await msg.author.removeItemsFromBank(cost.bank);

		await addSubTaskToActivityTask<EnchantingActivityTaskOptions>(this.client, {
			itemID: enchantable.id,
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			duration,
			type: Activity.Enchanting
		});

		const xpHr = `${Math.round(
			((enchantable.xp * quantity) / (duration / Time.Minute)) * 60
		).toLocaleString()} XP/Hr`;

		return msg.send(
			`${msg.author.minionName} is now enchanting ${quantity}x ${
				enchantable.name
			}, it'll take around ${formatDuration(
				duration
			)} to finish. Removed ${cost} from your bank. ${xpHr}`
		);
	}
}