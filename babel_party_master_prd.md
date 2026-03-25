# Babel Party - Master PRD

## 1. Document purpose

This document is the combined master PRD for Babel Party.

It consolidates:
- product vision
- MVP scope
- gameplay design
- device and room model
- technical architecture
- execution plan
- phased roadmap
- product expansion backlog

The goal is to provide one founder-ready reference for building the product from concept to first strong consumer version.

## 2. Product overview

Babel Party is a mobile-first social party game where players hear a short phrase in a foreign language, try to imitate what they heard, and then watch the app convert their attempt back into English.

The funny part is not classical translation.
The funny part is the collapse of meaning through sound imitation, memory failure, speech recognition, and reverse translation.

This creates a repeatable emotional loop:
- hear something strange
- try to repeat it
- wait in suspense
- see the bizarre result
- laugh with the group

At its core, Babel Party is:
- a social performance game
- a language-chaos party app
- a reveal-driven edutainment experience

## 3. Product vision

Build a party app that turns world languages into shared social comedy.

The long-term vision is a product that combines:
- the accessibility of a party game
- the unpredictability of AI-powered reveals
- the curiosity of edutainment
- the shareability of meme culture

The experience should feel like:
- telephone meets karaoke
- world languages meet social chaos
- AI translation meets party-night performance

## 4. Product thesis

The product wins if players feel:
- this is easy to start
- this got funny very quickly
- I want to play another round
- I want to show this to someone else
- this is chaotic, but in a good way

The product loses if it feels:
- too educational
- too slow
- too technical
- too strict about correctness
- dependent on perfect recognition
- too difficult to set up in a room

Therefore the product should optimize for:
- low setup friction
- fast rounds
- high reveal payoff
- strong social energy
- replayability
- optional learning, not mandatory learning

## 5. Core positioning

### Primary positioning
A party game where you imitate foreign phrases and AI turns your attempt into hilarious English nonsense.

### Supporting positioning lines
- Repeat what you hear. Then watch English fall apart.
- A world-language party game powered by speech chaos.
- Telephone meets karaoke meets AI translation.

### Category
Primary:
- party game / social game

Secondary:
- edutainment
- language curiosity
- creator-friendly social app

## 6. Target audience

### Primary audience
- groups of friends at home
- parties and pre-party hangouts
- couples and small groups looking for a funny shared activity
- fans of social party games like Jackbox-style experiences
- content creators who enjoy shareable funny moments

### Secondary audience
- families with older children
- students
- language-curious casual users
- streamers and Discord groups

### Best first-use context
4 to 8 people in one room with one host device and optional speaker or TV mirroring.

## 7. Core gameplay concept

The flagship gameplay loop is:

1. A short English phrase is selected.
2. Each player or team is assigned a foreign language.
3. The player hears the phrase translated and spoken in that language.
4. The player tries to repeat exactly what they heard.
5. The app transcribes their attempt in that assigned language.
6. The app translates the recognized phrase back into English.
7. The reverse-translated English result is revealed to the room.
8. Players score based on closeness, difficulty, and optionally funniness.

This structure creates a strong social loop because:
- the challenge is simple to understand
- the player performance is inherently funny
- the reveal is unpredictable
- failure is entertaining, not just punitive

## 8. Product principles

### Principle 1 - The reveal is the payoff
The app exists to create great reveal moments.

### Principle 2 - Failure must still feel rewarding
A bad attempt should still be funny and socially valuable.

### Principle 3 - Fast beats deep in party contexts
The room should never wait too long for the app.

### Principle 4 - Learning is optional
The app can teach curiosity about language, but it should not feel like a lesson.

### Principle 5 - Social rhythm matters more than perfect fairness
A slightly imperfect but hilarious round is better than a technically perfect but boring one.

### Principle 6 - Private effort, public reveal
Long-term, the best structure is private player input followed by a room-wide public reveal.

## 9. Main game mode for MVP

## Echo Translator

### High concept
Players hear a phrase in a foreign language, imitate it from sound and memory, and then watch the app convert their attempt back into English.

### Turn flow
1. Host starts room
2. Host chooses settings
3. App selects phrase
4. Player is assigned language
5. Player listens 1 to 3 times depending on difficulty
6. Player records imitation
7. App processes translation + transcription + reverse translation
8. Reveal screen shows:
   - original English phrase
   - assigned language
   - optional recognized foreign text
   - reverse-translated English result
   - points
   - funny reaction label
9. Next player or next round starts
10. Final summary after session ends

### Why this should be the first mode
- easiest to understand
- easiest to build
- closest to the original idea
- most directly funny
- best for early validation
- strongest shareability

## 10. Gameplay format options

The game should eventually support:
- solo players
- teams
- non-competitive party mode
- competitive point-based mode

For MVP, support:
- individual mode
- simple team mode
- optional funny vote bonus

## 11. Device and room model

This is a critical product decision.

There are three realistic device models.

## 11.1 Shared-device mode
One phone or tablet is used by the whole room.

### How it works
- one host starts the game
- active player takes device for their turn
- they listen and record
- device is turned back to group for reveal

### Pros
- lowest development complexity
- no join friction
- no account requirement
- fastest path to testing and launch

### Cons
- handoff friction
- less private
- not ideal for large groups

### Recommendation
This should be the MVP device model.

## 11.2 Host device plus shared display
One host device controls the game, but reveal screens are mirrored or cast to TV.

### How it works
- player uses host device for turn
- room sees reveal on larger screen
- audio can play through host device, TV, or speaker

### Pros
- stronger party atmosphere
- better group viewing
- more premium experience
- no guest install required

### Cons
- casting complexity
- setup variability across homes

### Recommendation
Plan for this from the start at architecture level, but do not block MVP on it.

## 11.3 Multi-device room mode
Each player joins on their own phone.

### How it works
- host creates room
- players join via code or QR
- players get their private audio prompt on their own device
- host screen or TV shows public reveal

### Pros
- best privacy during turn
- best scalability
- best long-term room experience
- easier path to remote play later

### Cons
- much more engineering work
- higher onboarding friction
- more sync edge cases

### Recommendation
Build this after MVP validation.

## 12. Audio and display integrations

## 12.1 Phone speaker
This is enough for the earliest MVP.

## 12.2 Bluetooth speaker
Useful for louder, more social reveals.
Should be considered a compatible OS-level output option early, but not deeply customized in MVP.

## 12.3 TV or external display
Very valuable because the reveal is the emotional climax.
Initial support should rely on:
- OS-level screen mirroring
- AirPlay or Google Cast at the device level
- larger reveal layouts that read well on mirrored screens

### Architecture recommendation
Even before direct TV integration exists, the reveal screen should be designed to look good on a large display.

## 13. MVP scope

The MVP should include:
- one flagship mode: Echo Translator
- one host device flow
- room creation
- player and team setup
- curated phrase library
- limited language set
- TTS playback
- voice recording
- speech recognition in assigned language
- reverse translation to English
- reveal screen
- simple scoring
- end-of-session summary
- optional share card export
- basic analytics

The MVP should not include:
- remote multiplayer
- required accounts for all players
- advanced casting
- custom phrase creation
- many modes
- live voice chat
- deep progression systems
- monetization systems
- global leaderboard

## 14. MVP success criteria

The MVP is successful if:
- groups laugh consistently at reveal moments
- groups choose to play several rounds without extra prompting
- rules are understood after one round
- room setup friction feels low
- testers remember and share specific reveal moments

### Suggested quantitative targets
- median time to first completed round under 2 minutes
- at least 60 percent of test groups play 3 or more rounds
- at least 40 percent of sessions generate at least one shared result
- at least 70 percent of players understand the loop after one round
- recognition failure stays within acceptable playtest bounds for supported languages

## 15. Feature requirements

## 15.1 Room creation
Host can:
- create room
- choose player count
- choose individual or teams
- set number of rounds
- choose difficulty preset
- choose phrase category or mixed mode
- choose language pool

## 15.2 Phrase library
The phrase library should contain short English phrases designed for comic mutation.

### Requirements
- 4 to 8 words ideally
- concrete
- vivid
- easy to compare after mutation
- safe and general-audience friendly
- not too dependent on rare names or obscure references

### Example phrases
- Harry Potter is the best magician
- The king lost his sandwich
- My uncle sells soup on the moon
- Grandma drives a tiger to work
- My cat studies ancient philosophy

### MVP phrase count
80 to 120 phrases

### Suggested categories
- pop culture
- animals
- food
- fantasy
- office nonsense
- everyday absurdity

## 15.3 Language pools
Languages should be chosen based on:
- API support quality
- pronunciation distinctiveness
- comedic value
- difficulty diversity

### Suggested MVP set
- Spanish
- Italian
- French
- German
- Greek
- Turkish
- Japanese
- Arabic

### Difficulty tiers
Easy:
- Spanish
- Italian
- French

Medium:
- German
- Greek
- Turkish

Chaos:
- Japanese
- Arabic

## 15.4 Playback system
For each turn:
- translate phrase into assigned language
- synthesize speech in assigned language
- play 1 to 3 times depending on difficulty

### Difficulty settings
Chill:
- easier languages
- shorter phrases
- 3 listens

Spicy:
- mixed languages
- medium phrases
- 2 listens

Chaos:
- harder languages
- slightly longer phrases
- 1 listen

## 15.5 Voice capture
Player records attempt through app.

### Requirements
- very simple record interaction
- visible timer
- reliable upload
- clear done state
- optional retry limit

## 15.6 Speech recognition
Player recording is transcribed in the assigned language.

### Rule
Recognition should target only the assigned language during MVP.
This reduces ambiguity and makes results more stable.

### Fallback behavior
If recognition fails:
- show a funny failure line
- optionally allow one retry
- keep room energy moving

## 15.7 Reverse translation
Recognized foreign text is translated back into English.
This becomes the core reveal output.

## 15.8 Scoring
Scoring should support fun, not punish it.

### Suggested MVP scoring
Base score:
- 3 points: very close
- 2 points: partially close
- 1 point: loosely related
- 0 points: unrelated

Bonus:
- +1 for hard language
- +1 funny vote bonus

### Important note
If exact automation is not good enough at first, internal playtests can use partial manual review until scoring logic stabilizes.

## 15.9 Reveal screen
This is the most important screen in the app.

### Required reveal elements
- original English phrase
- assigned language
- reverse-translated English result in largest text
- score
- funny label
- optional player playback button
- optional recognized foreign text

### UX principle
The reverse-translated English result should be visually dominant.

## 15.10 End-of-session summary
Should include:
- winner or team winner
- funniest result
- closest round
- total scores
- replay or new game CTA
- share card CTA

## 16. UX and screen list

### Home screen
- Start game
- How it works
- Settings

### Create room screen
- number of players
- teams toggle
- rounds
- difficulty
- phrase category
- language pool

### Lobby screen
- players list
- team setup
- settings summary
- start button

### Instruction screen
Very short rules:
1. Listen carefully
2. Repeat what you hear
3. Watch the app guess what you meant

### Turn screen
- player name
- assigned language
- listen button
- listens remaining
- record button
- submit

### Processing screen
- short animation
- funny copy like "Consulting the language spirits..."

### Reveal screen
- original phrase
- reverse result
- points
- next button

### Scoreboard screen
- round standing
- total standing
- next round

### Final summary screen
- winner
- funniest round
- closest round
- replay
- share

## 17. Content design rules

Good phrases are:
- short
- concrete
- funny even before mutation
- easy to visualize
- not too abstract
- rhythmically repeatable

Bad phrases are:
- abstract
- too technical
- too long
- too obscure
- too hard to compare

### Good examples
- The pirate bought a yoga mat
- My sandwich knows your secrets
- The doctor dances with penguins
- Our teacher married a robot chef

### Bad examples
- Freedom requires philosophical nuance
- Hyper-dimensional macroeconomic adjustment
- Benedict Cumberbatch categorically recontextualized it

## 18. Technical architecture

## 18.1 Recommended stack

### Frontend
- React Native recommended

Reason:
- fast mobile iteration
- mature ecosystem
- strong support for consumer app workflows

### Backend
- Supabase recommended

Reason:
- clean developer experience
- good relational data support
- storage
- auth if needed later
- edge functions / realtime options for future phases

### Server logic
- Supabase Edge Functions or lightweight Node service

### External services
Need support for:
- translation
- text-to-speech
- speech-to-text
- optional semantic scoring layer

## 18.2 Provider strategy

Use one main provider at first where possible.

### Option A
Google Cloud for:
- translation
- text-to-speech
- speech-to-text

### Option B
Azure for:
- speech
- text-to-speech
- speech translation-related workflows

### Recommendation
Choose based on pre-build testing of:
- language quality
- latency
- cost
- dev simplicity

Do not build a mixed provider architecture until testing proves it is necessary.

## 18.3 Turn pipeline
1. App chooses English phrase
2. Backend translates phrase to target language
3. Backend generates TTS audio
4. App plays audio
5. Player records attempt
6. Audio is uploaded
7. Backend transcribes audio in assigned language
8. Backend translates recognized text back to English
9. Scoring compares original phrase and reverse result
10. Result payload returns to client
11. Reveal screen renders

## 18.4 Data model

### Room
- id
- host_id
- status
- settings_json
- created_at

### Player
- id
- room_id
- name
- team_id nullable
- total_score

### Round
- id
- room_id
- round_number
- phrase_original_en
- category
- difficulty

### Turn
- id
- round_id
- player_id
- language_code
- translated_text
- tts_audio_url
- recording_url
- recognized_text
- reverse_translation_en
- closeness_score
- funny_vote_count
- total_score

### Phrase
- id
- phrase_text_en
- category
- difficulty_tag
- active

## 19. Architecture principles for future-proofing

Even if MVP uses one phone, system design should already think in terms of:
- room state
- player state
- turn state
- reveal state

This matters because future versions may include:
- TV or mirrored reveal display
- multi-device guest join
- remote play
- second-screen clients

### Future-proofing rule
Keep game state independent from any single screen rendering.

That means:
- screens display state
- state does not live only inside a local view flow
- the app can eventually support host, guest, and display clients

## 20. Execution plan

## Phase 0 - Concept validation
Duration:
1 to 2 weeks

### Goals
- prove the loop is funny
- test phrase formats
- test language shortlist
- compare providers
- establish acceptable latency

### Tasks
- write 100 candidate phrases
- shortlist 8 to 10 languages
- manually test translation + TTS + STT loop
- run 3 to 5 live group tests
- log funniest reveals, failure cases, and confusion

### Deliverables
- phrase library v1
- language shortlist
- provider decision
- MVP decisions memo

## Phase 1 - Product design sprint
Duration:
1 week

### Goals
- lock flow
- define screen structure
- define reveal hierarchy
- define scoring logic
- define analytics events

### Deliverables
- wireframes
- screen map
- event taxonomy
- final MVP scope

## Phase 2 - Technical foundation
Duration:
1 week

### Goals
- set up frontend shell
- set up backend
- prove end-to-end audio pipeline

### Deliverables
- app shell
- database and storage
- working test API flow
- sample round payload

## Phase 3 - MVP build sprint 1
Duration:
1 to 2 weeks

### Build
- home
- room creation
- player setup
- phrase selection
- language assignment
- playback
- recording
- processing
- reveal
- scoring

### Exit criterion
One full round works on one device.

## Phase 4 - MVP build sprint 2
Duration:
1 to 2 weeks

### Build
- full multi-round game flow
- scoreboard
- final summary
- team basics
- retry / failure states
- phrase category filters
- difficulty presets

### Exit criterion
A full game session works end to end.

## Phase 5 - Playtest polish
Duration:
1 week

### Build
- reveal polish
- better copy
- latency improvements
- better readability
- sound polish
- analytics
- optional share card

### Exit criterion
Product feels ready for outside testers.

## Phase 6 - External playtesting
Duration:
1 to 2 weeks

### Goals
- validate laughter and replayability
- identify room friction
- prioritize next features

### Deliverables
- playtest report
- bug list
- feature reprioritization
- go/no-go for broader launch

## 21. Analytics plan

Track:
- session start
- room created
- round completed
- full session completed
- listen count usage
- retry usage
- speech recognition failures
- average processing latency
- reveal shares
- funniest vote usage
- selected languages
- selected categories
- team vs individual preference

### Key questions analytics should answer
- which languages are funniest
- which languages are too frustrating
- which phrase lengths work best
- where people drop off
- whether reveal sharing is strong enough to matter as growth lever

## 22. Device roadmap

### Version 1
Shared-device only

### Version 1.5
Shared-device plus better mirrored-display experience

### Version 2
Optional guest join via QR or code
Host controls the room
Public reveal remains on host screen / mirrored TV

### Version 3
Remote and hybrid modes

## 23. Expansion roadmap and backlog

## 23.1 Post-MVP quality upgrades
- better reveal animations
- more phrase packs
- more language packs
- saved funniest rounds
- better scoreboard presentation
- session history
- stronger funny labels
- improved scoring explainability

## 23.2 Social room upgrades
- QR room join
- browser guest join
- multi-device local rooms
- cast-friendly room layouts
- host dashboard
- better speaker mode behavior
- display mode optimized for TV

## 23.3 Retention features
- daily challenge
- weekly language challenge
- saved favorites
- post-game montage export
- streaks
- community-voted funniest results

## 23.4 New game modes
### Telephone of Babel
Phrase mutates across players and languages.

### Match the Meaning
Others guess which English result came from a player's attempt.

### Sound Memory Duel
Players memorize and identify foreign audio sequences.

### Accent Heist
Two players imitate same phrase, others judge closeness.

### Babel Relay
Team passes distortions through a chain.

### Reverse Archaeology
Players see a bizarre mistranslation and guess the original.

## 23.5 Edutainment layer
- post-round language facts
- "why this sounded strange" mini cards
- pronunciation curiosity
- script and alphabet exploration
- compare-language mode

Important:
These should remain optional during party play.

## 23.6 Creator and event tools
- custom phrase packs
- creator mode
- TikTok-style export templates
- birthday / wedding / office packs
- branded overlays

## 23.7 Platform expansion
- tablet host mode
- TV companion app
- web spectator client
- remote party mode
- streamer mode
- family-safe mode
- classroom mode

## 24. Prioritization

## Must-have for MVP
- Echo Translator mode
- strong reveal screen
- curated phrase library
- limited language pool
- stable audio loop
- simple scoring
- full session flow
- analytics basics

## Should-have for early polish
- funny labels
- share card export
- team mode
- score recap
- retry handling

## Nice-to-have for later
- casting-specific support
- multi-device guest join
- saved history
- advanced stats
- daily challenges
- custom content

## 25. Open product questions

These should be resolved during testing, not by assumption.

- Which 6 to 8 languages have the best fun-to-frustration ratio?
- How often should retry be allowed?
- Is showing recognized foreign text helpful or distracting?
- Does funny vote improve engagement enough to keep?
- Does TV mirroring become a major demand early?
- Are teams more fun than individuals in actual play?
- Is custom phrase input worth the moderation burden?

## 26. Recommended answers for now

- curated phrases only at first
- host-only shared device MVP
- reverse English reveal should dominate
- foreign text should be optional in reveal
- automatic score plus optional funny vote
- TV support via mirroring first
- guest join later

## 27. Strategic recommendation

The product should be built in this order:

1. Prove the core loop is funny in real rooms.
2. Build a tight host-only MVP.
3. Polish reveal quality until it feels undeniably shareable.
4. Make the mirrored-display experience better.
5. Add multi-device guest join only after fun is validated.
6. Expand into more modes and content once the first mode has real retention.

This order protects the product from a common failure:
overbuilding infrastructure before proving delight.

## 28. Final summary

Babel Party has strong potential because it combines:
- a simple social mechanic
- performance tension
- AI-powered unpredictability
- repeatable reveal payoff
- natural shareability

Its success will depend less on technical novelty and more on:
- good phrase writing
- smart language selection
- fast audio pipeline
- strong reveal design
- low-friction room setup

The first version should be small, fast, and obviously fun.

If the reveal works, the product has real expansion potential.
If the reveal does not work, no amount of extra features will save it.
