import { calcWhatPercent, percentChance, reduceNumByPercent } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/BotCommand';
import { Activity, Tasks, Time } from '../../lib/constants';
import { MinigameIDsEnum } from '../../lib/minions/data/minigames';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import removeFoodFromUser from '../../lib/minions/functions/removeFoodFromUser';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { SkillsEnum } from '../../lib/skilling/types';
import { ZalcanoActivityTaskOptions } from '../../lib/types/minions';
import { formatDuration } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true,
			altProtection: true,
			requiredPermissions: ['ADD_REACTIONS', 'ATTACH_FILES']
		});
	}

	calcPerformance(kcLearned: number, skillPercentage: number) {
		let basePerformance = 50;

		// Up to +25% performance for KC
		basePerformance += Math.floor(kcLearned / 4);

		// Up to +20% Performance for Skill Levels
		basePerformance += Math.floor(skillPercentage / 10);

		return Math.min(100, basePerformance);
	}

	@minionNotBusy
	@requiresMinion
	async run(msg: KlasaMessage) {
		if (
			msg.author.skillLevel(SkillsEnum.Mining) < 70 ||
			msg.author.skillLevel(SkillsEnum.Smithing) < 70 ||
			msg.author.settings.get(UserSettings.QP) < 150
		) {
			return msg.send(
				`To fight Zalcano, you need: Level 70 Mining, Level 70 Smithing and 150 QP.`
			);
		}

		const kc = msg.author.getMinigameScore(MinigameIDsEnum.Zalcano);
		const kcLearned = Math.min(100, calcWhatPercent(kc, 100));

		const boosts = [];
		let baseTime = Time.Minute * 6;
		baseTime = reduceNumByPercent(baseTime, kcLearned / 6);
		boosts.push(`${(kcLearned / 6).toFixed(2)}% boost for experience`);

		const skillPercentage =
			msg.author.skillLevel(SkillsEnum.Mining) + msg.author.skillLevel(SkillsEnum.Smithing);

		baseTime = reduceNumByPercent(baseTime, skillPercentage / 40);
		boosts.push(`${skillPercentage / 40}% boost for levels`);

		let healAmountNeeded = 7 * 12;
		if (kc > 100) healAmountNeeded = 1 * 12;
		else if (kc > 50) healAmountNeeded = 3 * 12;
		else if (kc > 20) healAmountNeeded = 5 * 12;

		const quantity = Math.floor(msg.author.maxTripLength / baseTime);
		const duration = quantity * baseTime;

		const food = await removeFoodFromUser(
			this.client,
			msg.author,
			healAmountNeeded * quantity,
			Math.ceil(healAmountNeeded / quantity),
			'Zalcano'
		);

		await addSubTaskToActivityTask<ZalcanoActivityTaskOptions>(
			this.client,
			Tasks.MinigameTicker,
			{
				userID: msg.author.id,
				channelID: msg.channel.id,
				quantity,
				duration,
				type: Activity.Zalcano,
				minigameID: MinigameIDsEnum.Zalcano,
				performance: this.calcPerformance(kcLearned, skillPercentage),
				isMVP: percentChance(80)
			}
		);

		return msg.send(
			`${
				msg.author.minionName
			} is now off to kill Zalcano ${quantity}x times, their trip will take ${formatDuration(
				duration
			)}. (${formatDuration(
				baseTime
			)} per kill). Removed ${food}.\n\n**Boosts:** ${boosts.join(', ')}.`
		);
	}
}