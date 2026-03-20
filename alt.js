						components: [{
                                "type": 1,
                                "components": [
									[
										{
											"type": 2,
											"label": "Attaquer 1 fois",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "a:" + interaction.member.user.id,
											// "disabled": true
										},
										{
											"type": 2,
											"label": "Attaquer 4 fois",
											"style": 4,
											"custom_id": interaction.customId.split(":")[0] + "aaaa:" + interaction.member.user.id,
											// "disabled": true
										}
										{
											"type": 2,
											"label": "Se défendre",
											"style": 3,
											"custom_id": interaction.customId.split(":")[0] + "d:" + interaction.member.user.id,
											// "disabled": true
										},
										{
											"type": 2,
											"label": "Câliner",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0] + "h:" + interaction.member.user.id,
											// "disabled": true
										}
									],[
										{
											"type": 2,
											"label": "Recommencer",
											"style": 1,
											"custom_id": interaction.customId.split(":")[0] + "h:" + interaction.member.user.id,
											// "disabled": true
										}
									]
                                ]
                            }]