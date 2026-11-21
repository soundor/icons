//! A pass-through plugin: the test is about its UI.

use soundor::prelude::*;

#[derive(Default)]
pub struct LocalStore {}

#[derive(Default)]
pub struct SharedStore {}

pub struct PluginController;

impl Controller for PluginController {
    type Local = LocalStore;
    type Shared = SharedStore;
}

#[derive(Default)]
pub struct PluginProcessor;

impl Processor for PluginProcessor {
    fn prepare(&mut self, _ctx: &PrepareContext) {}

    fn process(&mut self, _ctx: &mut ProcessContext) {}
}

soundor::export!(PluginProcessor, PluginController);
