

import type { Project, Level, ObjectAction, ChangeLevelValue, MiniMenuAction, Monster } from '@/lib/types';

const getButanoX = (x: number, levelWidth: number) => x * 16 - (levelWidth * 16 / 2) + 8;


function generateActionCode(action: ObjectAction, project: Project, level: Level, isNested: boolean = false): string {
    let code = '';
    const indent = isNested ? '        ' : '    ';

    switch (action.type) {
        case 'message':
            code += `${indent}showMessage("${action.value}");\n`;
            break;
        case 'changeLevel': {
            const value = action.value as ChangeLevelValue;
            const targetLevelIndex = project.levels.findIndex(l => l.id === value.levelId);
            if (targetLevelIndex !== -1) {
                const targetLevel = project.levels[targetLevelIndex];
                const targetX = getButanoX(value.x, targetLevel.width);
                const targetY = `((${targetLevel.height} * 8) - (${value.y} * 16) - 8)`;
                code += `${indent}set_level(LevelID::${targetLevel.name.toUpperCase().replace(/\s/g, '_')}${targetLevelIndex});\n`;
                code += `${indent}global_player.x = bn::fixed(${targetX});\n`;
                code += `${indent}global_player.y = bn::fixed(${targetY});\n`;
                code += `${indent}if(player_sprite.has_value()) player_sprite->set_position(global_player.x, global_player.y);\n`;
            }
            break;
        }
        case 'playMusic': {
            const value = action.value as string;
            if (value) {
                const audioName = value.split('.')[0];
                 code += `${indent}bn::music_items::${audioName}.play(0.5);\n`;
            }
            break;
        }
        case 'stopMusic': {
            code += `${indent}bn::music::stop();\n`;
            break;
        }
        case 'showHideObject': {
            const value = action.value as { id: number, state: 'show' | 'hide' };
            code += `${indent}showHideObject(${value.id}, ${value.state === 'show'});\n`;
            break;
        }
        case 'showHidePlayer': {
            const value = action.value as { state: 'show' | 'hide' };
            code += `${indent}if(player_sprite.has_value()) player_sprite->set_visible(${value.state === 'show'});\n`;
            break;
        }
        case 'startBattle': {
            const monsterId = action.value as number;
            code += `${indent}start_battle(${monsterId});\n`;
            break;
        }
        case 'restoreHealth': {
            const amount = action.value as number;
            code += `${indent}global_player.health = bn::min(global_player.max_health, global_player.health + ${amount});\n`;
            break;
        }
        case 'restoreMana': {
            const amount = action.value as number;
            code += `${indent}global_player.mana = bn::min(global_player.max_mana, global_player.mana + ${amount});\n`;
            break;
        }
        case 'miniMenu': {
            const value = action.value as { options: MiniMenuAction[] };
            code += `${indent}{\n`;
            code += `${indent}    text_sprites.clear();\n`;
            code += `${indent}    int selection = 0;\n`;
            code += `${indent}    int num_options = ${value.options.length};\n`;
            code += `${indent}    bn::vector<bn::sprite_ptr, 16> menu_text_sprites;\n`;
            code += `${indent}    int box_y, text1_y, text2_y;\n`;

            code += `
        auto show_menu = [&]()
        {
            if (global_player.y >= 0)
            {
                box_y = MESSAGE_Y_POS_TOP;
                text1_y = TEXT_Y_POS_TOP_LINE1;
                text2_y = TEXT_Y_POS_TOP_LINE2;
            }
            else
            {
                box_y = MESSAGE_Y_POS_BOTTOM;
                text1_y = TEXT_Y_POS_BOTTOM_LINE1;
                text2_y = TEXT_Y_POS_BOTTOM_LINE2;
            }
            text_sprites.clear();
            text_generator_ptr->set_z_order(0);
            menu_text_sprites.clear();
            bg_message_box->set_position(0, box_y);
            bg_message_box->set_visible(true);
`;
            value.options.forEach((option, index) => {
                code += `
            bn::string<32> option_text_${index};
            if (selection == ${index}) option_text_${index}.append("> ");
            option_text_${index}.append("${option.text}");
            text_generator_ptr->generate(bn::fixed(-40), bn::fixed(text1_y + (16*${index})), option_text_${index}, menu_text_sprites);
`;
            })
            code += `
            for(auto& sprite : menu_text_sprites) { sprite.set_bg_priority(0); sprite.set_z_order(0); }
            bn::core::update();
        };\n
`;
            code += `${indent}    show_menu();\n`;
            code += `${indent}    while(true) {\n`;
            code += `${indent}        if(bn::keypad::up_pressed()) { selection = (selection > 0) ? selection - 1 : num_options - 1; show_menu(); }\n`;
            code += `${indent}        if(bn::keypad::down_pressed()) { selection = (selection < num_options - 1) ? selection + 1 : 0; show_menu(); }\n`;
            code += `${indent}        if(bn::keypad::a_pressed()) { break; }\n`;
            code += `${indent}        bn::core::update();\n`;
            code += `${indent}    }\n`;
            code += `${indent}    menu_text_sprites.clear();\n`;
            code += `${indent}    bg_message_box->set_visible(false);\n\n`;

            value.options.forEach((option, index) => {
                code += `${indent}    if (selection == ${index}) {\n`;
                if(option.actions) {
                    option.actions.forEach(subAction => {
                        code += generateActionCode(subAction, project, level, true);
                    });
                }
                code += `${indent}    }\n`;
            });
            code += `${indent}    bn::core::update();\n`;
            code += `${indent}}\n`;
            break;
        }
        default:
            break;
    }
    return code;
}


export function generateCode(project: Project): string {

  const playerStats = project.playerStats ?? { level: 1, health: 20, maxHealth: 20, mana: 10, maxMana: 10, attack: 5, magicAttack: 8, speed: 5, exp: 0, expToNextLevel: 100, potions: 3, smokeBombs: 1 };

  let levelEnums = '';
  let levelDataArrays = '';
  let levelDefinitions = '';
  let interactionFunctions = '';
  let onStartFunctions = '';
  let onStartCases = '';
  let interactionCases = '';
  let objectSpriteIncludes = '';
  let monsterSpriteIncludes = '';
  let bgIncludes = '';
  let audioIncludes = '';
  let objectSpriteGetters = '';
  let monsterDefinitions = '';
  let monsterCount = 0;

  if (project.objectSpriteData) {
      Object.keys(project.objectSpriteData).forEach(id => {
          const spriteData = project.objectSpriteData[Number(id)];
          if(spriteData){
              objectSpriteIncludes += `#include "bn_sprite_items_object_${id}.h"\n`;
              objectSpriteGetters += `        case ${id}:\n            return &bn::sprite_items::object_${id};\n`;
          }
      });
  }

  if (project.monsters && project.monsters.length > 0) {
    monsterCount = project.monsters.length;
    monsterDefinitions = project.monsters.map(m => 
        `    MonsterData{ ${m.id}, "${m.name}", ${m.level}, ${m.health}, ${m.attack}, ${m.speed}, ${m.sprite ? `&bn::sprite_items::monster_${m.id}`: 'nullptr'} }`
    ).join(',\n');
    project.monsters.forEach(monster => {
        if(monster.sprite){
            const monsterSpriteName = `monster_${monster.id}`;
            monsterSpriteIncludes += `#include "bn_sprite_items_${monsterSpriteName}.h"\n`;
        }
    });
  }
  
  if (project.audioAssets.length > 0) {
    audioIncludes = `#include "bn_music_items.h"`;
  }


  project.levels.forEach((level, index) => {
    const levelNameUpper = level.name.toUpperCase().replace(/\s/g, '_');
    const levelId = `${levelNameUpper}${index}`;
    levelEnums += `    ${levelId},\n`;

    const grid = level.grid;
    const reversedGrid = [...grid].reverse();

    // Generate Map Data
    levelDataArrays += `const int map_data_${index}[${level.height}][${level.width}] = {\n`;
    reversedGrid.forEach(row => {
        levelDataArrays += `    {${row.map(cell => cell.type === 1 ? '1' : '0').join(', ')}},\n`;
    });
    levelDataArrays += `};\n\n`;

    // Generate Object Data
    levelDataArrays += `const int object_data_${index}[${level.height}][${level.width}] = {\n`;
    reversedGrid.forEach(row => {
        levelDataArrays += `    {${row.map(cell => cell.type === 3 ? (cell.objectId || 0) : '0').join(', ')}},\n`;
    });
    levelDataArrays += `};\n\n`;
    
    // Generate Trigger Data
    levelDataArrays += `const int trigger_data_${index}[${level.height}][${level.width}] = {\n`;
    reversedGrid.forEach(row => {
        levelDataArrays += `    {${row.map(cell => cell.type === 2 ? (cell.triggerId || 0) : '0').join(', ')}},\n`;
    });
    levelDataArrays += `};\n\n`;

    const bgItemName = level.backgroundImage ? `level${index}_bg` : `textbox`;
    if (level.backgroundImage) {
        bgIncludes += `#include "bn_regular_bg_items_${bgItemName}.h"\n`;
    }

    const startX = level.playerStart ? getButanoX(level.playerStart.x, level.width) : 0;
    const startY = level.playerStart ? `(${level.playerStart.y} * -16 - 8)` : 0;

    levelDefinitions += `    { (const int*)map_data_${index}, (const int*)object_data_${index}, (const int*)trigger_data_${index}, ${level.width}, ${level.height}, bn::fixed(${startX}), bn::fixed(${startY}), &bn::regular_bg_items::${bgItemName} },\n`;

    // On-Start Actions
    if(level.onStartActions && level.onStartActions.length > 0) {
        onStartFunctions += `void on_start_level_${index}() {\n`;
        level.onStartActions.forEach(action => {
            onStartFunctions += generateActionCode(action, project, level);
        });
        onStartFunctions += `}\n\n`;
        onStartCases += `        case LevelID::${levelId}: on_start_level_${index}(); break;\n`;
    }

    // Object Interactions
    if (level.objectActions) {
        for (const objectId in level.objectActions) {
            interactionFunctions += `void interact_object_${index}_${objectId}() {\n`;
            level.objectActions[objectId].forEach(action => {
                interactionFunctions += generateActionCode(action, project, level);
            });
            interactionFunctions += `}\n\n`;
            interactionCases += `                    if(level_idx == ${index} && object_id == ${objectId}) { interact_object_${index}_${objectId}(); }\n`;
        }
    }
    
    // Trigger Interactions
    if (level.triggerActions) {
        for (const triggerId in level.triggerActions) {
            interactionFunctions += `void trigger_${index}_${triggerId}() {\n`;
            level.triggerActions[triggerId].forEach(action => {
                interactionFunctions += generateActionCode(action, project, level);
            });
            interactionFunctions += `}\n\n`;
            interactionCases += `        if(level_idx == ${index} && trigger_id == ${triggerId}) { trigger_${index}_${triggerId}(); }\n`;
        }
    }
  });


  return `
#include "bn_core.h"
#include "bn_keypad.h"
#include "bn_display.h"
#include "bn_vector.h"
#include "bn_string.h"
#include "bn_sprite_ptr.h"
#include "bn_sprite_tiles_ptr.h"
#include "bn_regular_bg_ptr.h"
#include "bn_sprite_text_generator.h"
#include "bn_sprite_actions.h"
#include "bn_music.h"
#include "bn_music_actions.h"
#include "common_variable_8x16_sprite_font.h"
#include "bn_music_item.h"
#include "bn_fixed.h"
#include "bn_math.h"
#include "bn_random.h"
#include "bn_optional.h"
#include "bn_sprite_items_player.h"

// Asset includes

${objectSpriteIncludes}
${monsterSpriteIncludes}
#include "bn_regular_bg_items_textbox.h"
#include "bn_regular_bg_items_battle_bg.h"
${bgIncludes}
${audioIncludes}

// =================================================================================================================
// ESTRUCTURAS Y CONSTANTES
// =================================================================================================================
const int TILE_SIZE = 16;

enum class Direction {
    DOWN,
    UP,
    LEFT,
    RIGHT
};
Direction last_direction = Direction::DOWN;


struct Player {
    bn::fixed x;
    bn::fixed y;
    bn::fixed speed = bn::fixed(${project.playerSpeed});
    int level = ${playerStats.level};
    int health = ${playerStats.health};
    int max_health = ${playerStats.maxHealth};
    int mana = ${playerStats.mana};
    int max_mana = ${playerStats.maxMana};
    int attack = ${playerStats.attack};
    int magic_attack = ${playerStats.magicAttack};
    int speed_stat = ${playerStats.speed};
    int exp = ${playerStats.exp};
    int exp_to_next_level = ${playerStats.expToNextLevel};
    int potions = ${playerStats.potions};
    int smokeBombs = ${playerStats.smokeBombs};
};

Player global_player; 

struct Object {
    int id;
    bn::sprite_ptr sprite;
};

struct MonsterData {
    int id;
    const char* name;
    int level;
    int health;
    int attack;
    int speed;
    const bn::sprite_item* sprite_item;
};

const int MONSTER_COUNT = ${monsterCount};
const MonsterData MONSTER_DATA_ARRAY[MONSTER_COUNT] = {
${monsterDefinitions}
};


enum class LevelID {
${levelEnums}
};

LevelID current_level_id;

${levelDataArrays}

struct LevelData {
    const int* map_data;
    const int* object_data;
    const int* trigger_data;
    int width;
    int height;
    bn::fixed player_start_x;
    bn::fixed player_start_y;
    const bn::regular_bg_item* bg_item;
};

const LevelData level_definitions[] = {
${levelDefinitions}
};

const LevelData* current_level_data = nullptr;

// =================================================================================================================
// DECLARACIÓN DE OBJETOS GLOBALES 
// =================================================================================================================

const int MESSAGE_Y_POS_TOP = -50; 
const int TEXT_Y_POS_TOP_LINE1 = -65;
const int TEXT_Y_POS_TOP_LINE2 = -49;

const int MESSAGE_Y_POS_BOTTOM = 50; 
const int TEXT_Y_POS_BOTTOM_LINE1 = 35;
const int TEXT_Y_POS_BOTTOM_LINE2 = 51;

bn::optional<bn::sprite_ptr> player_sprite;

bn::optional<bn::regular_bg_ptr> current_bg;
bn::optional<bn::regular_bg_ptr> bg_message_box;
bn::optional<bn::regular_bg_ptr> battle_bg;
bn::optional<bn::sprite_text_generator> text_generator_ptr;
bn::vector<bn::sprite_ptr, 48> text_sprites;
bn::vector<Object, 32> level_objects;
bn::fixed anim_frame = bn::fixed(0);
bn::random random_generator;

// --- Declaraciones de funciones ---
void set_level(LevelID level_id);
void showMessage(const bn::string_view& message);
int toTileX(bn::fixed pixel_x);
int toTileY(bn::fixed pixel_y);
bool isCollision(int tile_x, int tile_y);
void showHideObject(int object_id, bool visible);
void start_battle(int monster_id);
void check_for_level_up();
int getButanoX(int tile_x, int level_width);


${onStartFunctions}
${interactionFunctions}

// =================================================================================================================
// FUNCIONES DE JUEGO
// =================================================================================================================

int getButanoX(int tile_x, int level_width) {
    return tile_x * TILE_SIZE - (level_width * TILE_SIZE / 2) + TILE_SIZE / 2;
}

int toTileX(bn::fixed pixel_x) {
    if (!current_level_data) return 0;
    return (pixel_x.right_shift_integer() + (current_level_data->width * TILE_SIZE / 2) - (TILE_SIZE / 2)) / TILE_SIZE;
}

int toTileY(bn::fixed pixel_y) {
    if (!current_level_data) return 0;
    return ((current_level_data->height * 8) - pixel_y.right_shift_integer() - 8) / TILE_SIZE;
}


bool isCollision(int tile_x, int tile_y)
{
    if (!current_level_data) return true;
    if (tile_x < 0 || tile_x >= current_level_data->width || tile_y < 0 || tile_y >= current_level_data->height) {
        return true;
    }
    int tile_index = tile_y * current_level_data->width + tile_x;
    
    if (current_level_data->map_data[tile_index] != 0) {
        return true;
    }

    for(const auto& obj : level_objects) {
        if(obj.sprite.visible()) {
            int obj_tile_x = toTileX(obj.sprite.x());
            int obj_tile_y = toTileY(obj.sprite.y());
            if(obj_tile_x == tile_x && obj_tile_y == tile_y) {
                return true;
            }
        }
    }

    return false;
}

void showMessage(const bn::string_view& message)
{
    if (!text_generator_ptr.has_value() || !bg_message_box.has_value())
    {
        return;
    }

    text_sprites.clear();

    int box_y;
    int text1_y;
    int text2_y;

    if (global_player.y >= 0)
    {
        box_y = MESSAGE_Y_POS_TOP;
        text1_y = TEXT_Y_POS_TOP_LINE1;
        text2_y = TEXT_Y_POS_TOP_LINE2;
    }
    else
    {
        box_y = MESSAGE_Y_POS_BOTTOM;
        text1_y = TEXT_Y_POS_BOTTOM_LINE1;
        text2_y = TEXT_Y_POS_BOTTOM_LINE2;
    }

    bg_message_box->set_position(0, box_y);
    bg_message_box->set_visible(true);
    bg_message_box->set_priority(1);
    bg_message_box->set_z_order(1);

    text_generator_ptr->set_z_order(0);
    text_generator_ptr->set_bg_priority(0);
    
    bn::string<24> line1 = message.substr(0, 24);
    text_generator_ptr->generate(bn::fixed(-88), bn::fixed(text1_y), line1, text_sprites);
    if (message.size() > 24)
    {
        bn::string<24> line2 = message.substr(24, 24);
        text_generator_ptr->generate(bn::fixed(-88), bn::fixed(text2_y), line2, text_sprites);
    }
    
    for(bn::sprite_ptr& sprite : text_sprites) {
        sprite.set_bg_priority(0);
        sprite.set_z_order(0);
    }
    
    while(bn::keypad::a_held()){ bn::core::update(); }

    while (!bn::keypad::a_pressed())
    {
        bn::core::update();
    }
    
    text_sprites.clear();
    bg_message_box->set_visible(false);
}

void check_triggers() {
    if (!current_level_data) return;
    int grid_x = toTileX(global_player.x);
    int grid_y = toTileY(global_player.y);

    if (grid_x >= 0 && grid_x < current_level_data->width && grid_y >= 0 && grid_y < current_level_data->height) {
        int tile_index = grid_y * current_level_data->width + grid_x;
        int trigger_id = current_level_data->trigger_data[tile_index];

        if (trigger_id > 0) {
            int level_idx = (int)current_level_id;
${interactionCases
    .split('\n')
    .filter(line => line.includes('trigger_'))
    .join('\n')}
        }
    }
}

void movePlayer()
{
    if (!current_level_data || !player_sprite.has_value())
        return;

    int frame_index = (anim_frame.floor_integer() / 4) % 4; 

    if (bn::keypad::left_held())
    {
        last_direction = Direction::LEFT;
        int next_tile_x = toTileX(global_player.x - TILE_SIZE);
        int current_tile_y = toTileY(global_player.y);
        player_sprite->set_tiles(bn::sprite_items::player.tiles_item().create_tiles(8 + frame_index));
        if (!isCollision(next_tile_x, current_tile_y))
        {
            for (int i = 0; i < TILE_SIZE / global_player.speed; i++)
            {
                global_player.x -= global_player.speed;
                player_sprite->set_x(global_player.x);
                anim_frame += 0.25 * global_player.speed;
                frame_index = (anim_frame.floor_integer() / 4) % 4;
                bn::core::update();
            }
            check_triggers();
        }
    }
    else if (bn::keypad::right_held())
    {
        last_direction = Direction::RIGHT;
        int next_tile_x = toTileX(global_player.x + TILE_SIZE);
        int current_tile_y = toTileY(global_player.y);
        player_sprite->set_tiles(bn::sprite_items::player.tiles_item().create_tiles(12 + frame_index));
        if (!isCollision(next_tile_x, current_tile_y))
        {
            for (int i = 0; i < TILE_SIZE / global_player.speed; i++)
            {
                global_player.x += global_player.speed;
                player_sprite->set_x(global_player.x);
                anim_frame += 0.25 * global_player.speed;
                frame_index = (anim_frame.floor_integer() / 4) % 4;
                bn::core::update();
            }
            check_triggers();
        }
    }
    else if (bn::keypad::up_held())
    {
        last_direction = Direction::UP;
        int current_tile_x = toTileX(global_player.x);
        int next_tile_y = toTileY(global_player.y - TILE_SIZE); // Adjusted for correct coordinate system
        player_sprite->set_tiles(bn::sprite_items::player.tiles_item().create_tiles(4 + frame_index));
        if (!isCollision(current_tile_x, next_tile_y))
        {
            for (int i = 0; i < TILE_SIZE / global_player.speed; i++)
            {
                global_player.y -= global_player.speed;
                player_sprite->set_y(global_player.y);
                anim_frame += 0.25 * global_player.speed;
                frame_index = (anim_frame.floor_integer() / 4) % 4;
                bn::core::update();
            }
            check_triggers();
        }
    }
    else if (bn::keypad::down_held())
    {
        last_direction = Direction::DOWN;
        int current_tile_x = toTileX(global_player.x);
        int next_tile_y = toTileY(global_player.y + TILE_SIZE); // Adjusted for correct coordinate system
        player_sprite->set_tiles(bn::sprite_items::player.tiles_item().create_tiles(0 + frame_index));
        if (!isCollision(current_tile_x, next_tile_y))
        {
            for (int i = 0; i < TILE_SIZE / global_player.speed; i++)
            {
                global_player.y += global_player.speed;
                player_sprite->set_y(global_player.y);
                anim_frame += 0.25 * global_player.speed;
                frame_index = (anim_frame.floor_integer() / 4) % 4;
                bn::core::update();
            }
            check_triggers();
        }
    }

    if (anim_frame >= 16)
    {
        anim_frame = 0;
    }
}



void showHideObject(int object_id, bool visible) {
    for(Object& obj : level_objects) {
        if(obj.id == object_id) {
            obj.sprite.set_visible(visible);
            return;
        }
    }
}

void check_interactions() {
    if (bn::keypad::a_pressed() && current_level_data) {
        int player_x = toTileX(global_player.x);
        int player_y = toTileY(global_player.y);
        
        int check_x = player_x;
        int check_y = player_y;

        if(last_direction == Direction::DOWN) { check_y += 1; }
        else if(last_direction == Direction::UP) { check_y -= 1; }
        else if(last_direction == Direction::LEFT) { check_x -= 1; }
        else if(last_direction == Direction::RIGHT) { check_x += 1; }

        if (check_x >= 0 && check_x < current_level_data->width && check_y >= 0 && check_y < current_level_data->height) {
            int tile_index = check_y * current_level_data->width + check_x;
            int object_id = current_level_data->object_data[tile_index];
            if (object_id > 0) {
                for(const auto& obj : level_objects) {
                    if(obj.id == object_id && obj.sprite.visible()) {
                        int level_idx = (int)current_level_id;
${interactionCases
    .split('\n')
    .filter(line => line.includes('interact_object_'))
    .join('\n')}
                    }
                }
            }
        }
    }
}


const bn::sprite_item* get_object_sprite_item(int object_id) {
    switch(object_id) {
${objectSpriteGetters}
        default:
            return nullptr;
    }
}

void check_for_level_up() {
    while (global_player.exp >= global_player.exp_to_next_level) {
        global_player.exp -= global_player.exp_to_next_level;
        global_player.level++;
        global_player.max_health += 5;
        global_player.max_mana += 3;
        global_player.attack += 2;
        global_player.magic_attack += 2;
        global_player.speed_stat += 1;
        global_player.health = global_player.max_health;
        global_player.mana = global_player.max_mana;
        global_player.exp_to_next_level = (int)(20 * global_player.level * 1.2);
        
        showMessage("You leveled up!");
        showMessage("Stats have increased!");
    }
}


// =================================================================================================================
// BATTLE SYSTEM
// =================================================================================================================

int show_menu_and_get_selection(const bn::vector<bn::string_view, 8>& options, bool show_stats) {
    bn::vector<bn::sprite_ptr, 32> menu_sprites;
    int selection = 0;
    
    auto update_menu_display = [&]() {
        menu_sprites.clear();
        
        bg_message_box->set_position(0, MESSAGE_Y_POS_BOTTOM);
        bg_message_box->set_visible(true);
        bg_message_box->set_z_order(1);
        text_generator_ptr->set_z_order(0);
        text_generator_ptr->set_bg_priority(0);


        for(int i = 0; i < options.size(); ++i) {
            bn::string<32> line;
            if(i == selection) {
                line.append(">");
            }
            line.append(options[i]);
            text_generator_ptr->generate(bn::fixed(-72 + (i % 2) * 80), bn::fixed(TEXT_Y_POS_BOTTOM_LINE1 + (i / 2) * 16), line, menu_sprites);
        }

        if(show_stats) {
            bn::string<32> player_stats_str;
            player_stats_str.append("HP: ");
            player_stats_str.append(bn::to_string<16>(global_player.health));
            player_stats_str.append("/");
            player_stats_str.append(bn::to_string<16>(global_player.max_health));
            text_generator_ptr->generate(bn::fixed(-72), bn::fixed(-70), player_stats_str, menu_sprites);

            bn::string<32> player_mana_str;
            player_mana_str.append("MP: ");
            player_mana_str.append(bn::to_string<16>(global_player.mana));
            player_mana_str.append("/");
            player_mana_str.append(bn::to_string<16>(global_player.max_mana));
            text_generator_ptr->generate(bn::fixed(8), bn::fixed(-70), player_mana_str, menu_sprites);
        }

        for(auto& sprite : menu_sprites) {
            sprite.set_z_order(0);
            sprite.set_bg_priority(0);
        }
    };

    update_menu_display();

    while(bn::keypad::a_held()) { bn::core::update(); }
    while(true) {
        if(bn::keypad::up_pressed()) {
            if(selection >= 2) selection -= 2;
            update_menu_display();
        } else if(bn::keypad::down_pressed()) {
            if(selection < options.size() - 2) selection += 2;
            update_menu_display();
        } else if(bn::keypad::left_pressed()) {
            if(selection % 2 != 0) selection -= 1;
            update_menu_display();
        } else if(bn::keypad::right_pressed()) {
            if(selection % 2 == 0 && selection < options.size() - 1) selection += 1;
            update_menu_display();
        } else if(bn::keypad::a_pressed()) {
            bn::core::update();
            menu_sprites.clear();
            return selection;
        }
        bn::core::update();
    }
}


void start_battle(int monster_id) {
    const MonsterData* monster_data = nullptr;
    for (int i = 0; i < MONSTER_COUNT; ++i) {
        if (MONSTER_DATA_ARRAY[i].id == monster_id) {
            monster_data = &MONSTER_DATA_ARRAY[i];
            break;
        }
    }
    if (!monster_data) return;

    bn::vector<int, 32> visible_object_ids;
    if(player_sprite.has_value()) player_sprite->set_visible(false);
    for(Object& obj : level_objects) { 
        if(obj.sprite.visible()) {
            visible_object_ids.push_back(obj.id);
            obj.sprite.set_visible(false); 
        }
    }
    if(current_bg.has_value()) current_bg->set_visible(false);
    
    battle_bg->set_visible(true);

    bn::optional<bn::sprite_ptr> monster_sprite;
    if(monster_data->sprite_item) {
        monster_sprite = monster_data->sprite_item->create_sprite(0, -30);
        monster_sprite->set_z_order(0);
    }
    
    int monster_hp = monster_data->health;

    showMessage(bn::string<48>("A wild ") + monster_data->name + " appears!");

    bool in_battle = true;
    bool player_turn_first = (global_player.speed_stat * global_player.level) >= (monster_data->speed * monster_data->level);
    bool is_player_turn = player_turn_first;
    
    while(bn::keypad::a_held()){ bn::core::update(); }

    while(in_battle) {
        if(is_player_turn) {
            bn::vector<bn::string_view, 8> main_options;
            main_options.push_back("Attack");
            main_options.push_back("Item");
            main_options.push_back("Flee");
            int choice = show_menu_and_get_selection(main_options, true);

            if (choice == 0) { // Attack
                bn::vector<bn::string_view, 8> attack_options;
                attack_options.push_back("Normal");
                attack_options.push_back("Magic");
                attack_options.push_back("Back");
                int attack_choice = show_menu_and_get_selection(attack_options, true);

                if (attack_choice == 0) { // Normal
                    int damage = global_player.attack;
                    monster_hp -= damage;
                    showMessage(bn::string<48>("Player deals ") + bn::to_string<16>(damage) + " damage!");
                } else if (attack_choice == 1) { // Magic
                    if (global_player.mana >= 5) {
                        global_player.mana -= 5;
                        int damage = global_player.magic_attack;
                        monster_hp -= damage;
                        showMessage(bn::string<48>("Player deals magic ") + bn::to_string<16>(damage) + " damage!");
                    } else {
                        showMessage("Not enough mana!");
                        continue; // Go back to player's turn
                    }
                } else { // Back
                    continue; // Go back to main menu
                }
            } else if (choice == 1) { // Item
                 bn::vector<bn::string_view, 8> item_options;
                item_options.push_back("Potion");
                item_options.push_back("Smoke Bomb");
                item_options.push_back("Back");
                int item_choice = show_menu_and_get_selection(item_options, true);

                if(item_choice == 0) { // Potion
                    if(global_player.potions > 0) {
                        global_player.potions--;
                        global_player.health = bn::min(global_player.max_health, global_player.health + 20);
                        showMessage("Used a potion.");
                    } else {
                        showMessage("No potions left!");
                        continue;
                    }
                } else if (item_choice == 1) { // Smoke Bomb
                     if(global_player.smokeBombs > 0) { 
                        global_player.smokeBombs--;
                        showMessage("Used a smoke bomb.");
                        if (random_generator.get_int(100) < 95) {
                            showMessage("Got away safely!");
                            in_battle = false;
                        } else {
                            showMessage("Can't escape!");
                        }
                    } else {
                        showMessage("No smoke bombs left!");
                        continue;
                    }
                } else { // Back
                    continue;
                }
            } else if (choice == 2) { // Flee
                if (random_generator.get_int(100) < 80) {
                    showMessage("Got away safely!");
                    in_battle = false;
                } else {
                    showMessage("Can't escape!");
                }
            }
        } else { // Monster's turn
            int damage = monster_data->attack;
            global_player.health -= damage;
            showMessage(bn::string<48>("Enemy deals ") + bn::to_string<16>(damage) + " damage!");
        }

        if (monster_hp <= 0) {
            showMessage("You won the battle!");
            int exp_gained = monster_data->health + monster_data->attack;
            global_player.exp += exp_gained;
            showMessage(bn::string<48>("Gained ") + bn::to_string<16>(exp_gained) + " EXP!");
            check_for_level_up();
            in_battle = false;
        } else if (global_player.health <= 0) {
            showMessage("You were defeated...");
            bn::music::stop();
            if(monster_sprite.has_value()) monster_sprite.reset();
            battle_bg->set_visible(false);
            text_sprites.clear();
            bg_message_box->set_visible(false);
            
            global_player.health = global_player.max_health;
            global_player.mana = global_player.max_mana;
            set_level(LevelID::${project.levels.length > 0 ? project.levels[0].name.toUpperCase().replace(/\s/g, '_') + '0' : ''});
            
            if(player_sprite.has_value()) {
                player_sprite->set_visible(true);
                player_sprite->set_position(current_level_data->player_start_x, current_level_data->player_start_y);
            }

            in_battle = false;
            return;
        }

        if(in_battle) {
           is_player_turn = !is_player_turn;
        }
    }
    
    if(monster_sprite.has_value()) monster_sprite.reset();
    if(player_sprite.has_value()) player_sprite->set_visible(true);
    for(int id : visible_object_ids) {
        showHideObject(id, true);
    }
    if(current_bg.has_value()) current_bg->set_visible(true);
    battle_bg->set_visible(false);
    bn::core::update();
}

void set_level(LevelID level_id) {
    current_level_id = level_id;
    int level_idx = (int)level_id;
    current_level_data = &level_definitions[level_idx];

    level_objects.clear();

    if (current_level_data->bg_item) {
        current_bg = current_level_data->bg_item->create_bg(0, 0);
        current_bg->set_priority(3);
    } else {
        current_bg.reset();
    }
    
    global_player.x = current_level_data->player_start_x;
    global_player.y = current_level_data->player_start_y;
    if(player_sprite.has_value()){
        player_sprite->set_position(global_player.x, global_player.y);
    }

    for(int y = 0; y < current_level_data->height; ++y) {
        for(int x = 0; x < current_level_data->width; ++x) {
            int tile_index = y * current_level_data->width + x;
            int object_id = current_level_data->object_data[tile_index];
            if(object_id > 0) {
                const bn::sprite_item* item = get_object_sprite_item(object_id);
                if(item) {
                    bn::fixed obj_x = bn::fixed(getButanoX(x, current_level_data->width));
                    bn::fixed obj_y = bn::fixed((current_level_data->height * 8) - (y * 16) - 8);
                    bn::sprite_ptr new_sprite = item->create_sprite(obj_x, obj_y);
                    new_sprite.set_z_order(1);
                    level_objects.push_back({object_id, new_sprite});
                }
            }
        }
    }
    
    switch(level_id) {
${onStartCases}
        default:
            break;
    }
}

// =================================================================================================================
// FUNCIÓN PRINCIPAL
// =================================================================================================================

int main()
{
    bn::core::init();

    player_sprite.emplace(bn::sprite_items::player.create_sprite(0,0));
    player_sprite->set_z_order(1);
    
    bg_message_box.emplace(bn::regular_bg_items::textbox.create_bg(0, 0));
    bg_message_box->set_priority(1);
    bg_message_box->set_visible(false);

    battle_bg.emplace(bn::regular_bg_items::battle_bg.create_bg(0,0));
    battle_bg->set_priority(3);
    battle_bg->set_visible(false);
    
    text_generator_ptr.emplace(common::variable_8x16_sprite_font);
    
    set_level(LevelID::${project.levels.length > 0 ? project.levels[0].name.toUpperCase().replace(/\s/g, '_') + '0' : ''});

    while (true)
    {
        movePlayer();
        check_interactions();
        bn::core::update();
    }
}
`;
}
